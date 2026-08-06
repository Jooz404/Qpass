import api from './api';

const OFFLINE_STORAGE_KEY = 'qpass_offline_locations';
const ACTIVE_TRACKING_KEY = 'qpass_active_tracking_lo';

class LocationService {
  constructor() {
    this.watchId = null;
    this.intervalId = null;
    this.activeLoId = null;
    this.isTracking = false;
    this.listeners = new Set();
    this.lastPosition = null;

    // Restore active tracking if reloaded mid-journey
    const savedLoId = localStorage.getItem(ACTIVE_TRACKING_KEY);
    if (savedLoId) {
      this.activeLoId = parseInt(savedLoId, 10);
    }

    // Attach network status listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushOfflineQueue());
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in location listener:', err);
      }
    });
  }

  isTrackingActive() {
    return this.isTracking;
  }

  getActiveLoId() {
    return this.activeLoId;
  }

  getLastPosition() {
    return this.lastPosition;
  }

  async startTracking(loId) {
    if (!navigator.geolocation) {
      throw new Error('Geolokasi tidak didukung oleh browser Anda');
    }

    this.activeLoId = loId;
    this.isTracking = true;
    localStorage.setItem(ACTIVE_TRACKING_KEY, loId.toString());

    // Flush any pending offline queue first
    await this.flushOfflineQueue();

    // Capture initial position immediately
    this.captureAndSendPosition();

    // Set up periodic tracking (every 30 seconds for battery efficiency)
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.captureAndSendPosition();
    }, 30000);

    // Also use watchPosition for high-precision movement updates
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.handlePositionChange(pos);
      },
      (err) => {
        console.warn('Geolocation watch position warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );

    this.notifyListeners({ isTracking: true, loId: this.activeLoId });
  }

  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.activeLoId = null;
    this.lastPosition = null;
    localStorage.removeItem(ACTIVE_TRACKING_KEY);

    this.notifyListeners({ isTracking: false, loId: null });
  }

  captureAndSendPosition() {
    if (!navigator.geolocation || !this.isTracking) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePositionChange(pos),
      (err) => console.warn('Get current position error:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  async handlePositionChange(pos) {
    if (!this.isTracking || !this.activeLoId) return;

    const coords = pos.coords;
    const locationData = {
      loId: this.activeLoId,
      lat: coords.latitude,
      lng: coords.longitude,
      speed: coords.speed ? Math.round(coords.speed * 3.6) : 0, // Convert m/s to km/h
      heading: coords.heading || 0,
      accuracy: coords.accuracy || 0,
      recordedAt: new Date().toISOString(),
      status: 'IN_TRANSIT',
    };

    this.lastPosition = locationData;
    this.notifyListeners({ isTracking: true, loId: this.activeLoId, position: locationData });

    // Send to backend if online, otherwise queue offline
    if (navigator.onLine) {
      try {
        await api.post('/location/update', locationData);
      } catch (err) {
        console.warn('Failed to send real-time location update, queueing offline:', err.message);
        this.saveOfflineLocation(locationData);
      }
    } else {
      this.saveOfflineLocation(locationData);
    }
  }

  saveOfflineLocation(data) {
    try {
      const existingStr = localStorage.getItem(OFFLINE_STORAGE_KEY);
      const queue = existingStr ? JSON.parse(existingStr) : [];
      queue.push(data);
      // Keep last 100 offline logs to prevent memory overflow
      if (queue.length > 100) queue.shift();
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error saving offline location:', e);
    }
  }

  async flushOfflineQueue() {
    if (!navigator.onLine) return;
    try {
      const existingStr = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (!existingStr) return;

      const queue = JSON.parse(existingStr);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`📡 Flushing ${queue.length} offline location logs to server...`);
      await api.post('/location/update', { locations: queue });
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
    } catch (err) {
      console.warn('Error flushing offline location queue:', err.message);
    }
  }
}

export const locationService = new LocationService();
export default locationService;
