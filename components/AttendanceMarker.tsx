import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import MapComponent from './MapComponent';
import { OFFICE_COORDS, ATTENDANCE_RADIUS_METERS } from '../constants';
import { MapPin, Navigation, ShieldCheck, AlertOctagon, RefreshCw } from 'lucide-react';

const AttendanceMarker: React.FC = () => {
  const { user } = useAuth();
  const { attendance, markCheckIn, markCheckOut } = useData();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.date === today && a.userId === user?.id);

  // Haversine Formula for distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getLocation = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        const dist = calculateDistance(latitude, longitude, OFFICE_COORDS.lat, OFFICE_COORDS.lng);
        setDistance(Math.round(dist));
        setIsLocating(false);
      },
      (err) => {
        console.error("Geolocation Error:", err);
        let msg = err.message || "Unable to retrieve location.";
        
        // Map common error codes
        if (err.code === 1) msg = "Permission denied. Please allow location access in your browser settings.";
        else if (err.code === 2) msg = "Position unavailable. Please check your GPS signal.";
        else if (err.code === 3) msg = "Location request timed out. Please try again.";
        
        setError(msg);
        setIsLocating(false);
      },
      options
    );
  };

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    if (!location) {
        getLocation();
        return;
    }
    setIsProcessing(true);
    const isRemote = (distance || 0) > ATTENDANCE_RADIUS_METERS;
    try {
      await markCheckIn(location.lat, location.lng, isRemote);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    try {
      await markCheckOut();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isInsideRadius = distance !== null && distance <= ATTENDANCE_RADIUS_METERS;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Controls */}
      <div className="w-full lg:w-1/3 space-y-6 flex flex-col">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Navigation className="w-6 h-6 mr-2 text-blue-500" />
                Attendance
            </h2>
            <button 
                onClick={getLocation} 
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Refresh GPS"
            >
                <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-500">Today's Date</p>
                    <p className="text-lg font-semibold text-slate-800">{new Date().toDateString()}</p>
                </div>
                <div className="text-right">
                     <p className="text-sm text-slate-500">Time</p>
                     <p className="text-lg font-semibold text-slate-800">
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start animate-in fade-in slide-in-from-top-2">
                    <AlertOctagon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            <div className="py-2">
                {isLocating ? (
                    <div className="flex flex-col items-center justify-center py-4 text-blue-600">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-sm font-medium">Acquiring precise GPS signal...</span>
                    </div>
                ) : location ? (
                    <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                         <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Status:</span>
                            <div className={`flex items-center font-medium ${isInsideRadius ? 'text-green-600' : 'text-orange-500'}`}>
                                <ShieldCheck className="w-4 h-4 mr-1.5" />
                                {isInsideRadius ? 'Office Zone' : 'Remote / Field'}
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${isInsideRadius ? 'bg-green-500' : 'bg-orange-400'}`} style={{width: '100%'}}></div>
                        </div>
                        <p className="text-xs text-slate-400 text-center">Distance from Office: {distance} meters</p>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-slate-400 text-sm mb-2">Location required to mark attendance</p>
                        <button onClick={getLocation} className="text-blue-600 font-medium text-sm hover:underline">Retry Location Access</button>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {!todayRecord ? (
                    <button 
                        onClick={handleCheckIn}
                        disabled={isLocating || !location || isProcessing}
                        className={`w-full py-4 rounded-xl shadow-lg font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center ${
                            !location || isProcessing ? 'bg-slate-300 cursor-not-allowed text-slate-500' :
                            isInsideRadius ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' : 
                            'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700'
                        }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processing...</span>
                        ) : (
                            <span>{isInsideRadius ? 'Check In at Office' : 'Remote Check In'}</span>
                        )}
                    </button>
                ) : !todayRecord.checkOutTime ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                            <p className="text-green-800 font-medium">Checked In</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                                {new Date(todayRecord.checkInTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <button 
                            onClick={handleCheckOut}
                            disabled={isProcessing}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md font-bold text-lg transition-transform transform active:scale-95 flex items-center justify-center"
                        >
                            {isProcessing ? 'Processing...' : 'Check Out'}
                        </button>
                    </div>
                ) : (
                    <div className="p-6 bg-slate-100 rounded-xl text-center border border-slate-200">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-slate-800 font-bold">Attendance Completed</p>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-2 rounded border border-slate-200">
                                <span className="block text-xs text-slate-400">IN</span>
                                <span className="font-mono font-semibold">{new Date(todayRecord.checkInTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200">
                                <span className="block text-xs text-slate-400">OUT</span>
                                <span className="font-mono font-semibold">{new Date(todayRecord.checkOutTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full lg:w-2/3 bg-white p-2 rounded-xl shadow-sm border border-slate-100 h-full min-h-[400px] relative z-0">
        <MapComponent userLocation={location} />
        
        {!location && !isLocating && (
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center z-[400] rounded-xl">
                <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm mx-4">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Location Needed</h3>
                    <p className="text-slate-500 text-sm mb-4">We need your location to verify your attendance zone.</p>
                    <button onClick={getLocation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Enable Location
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMarker;
