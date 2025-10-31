"use client";

import { useEffect, useState } from "react";

interface EnvironmentStatus {
  isSupported: boolean;
  issues: string[];
}

export const VapiEnvironmentCheck = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<EnvironmentStatus>({ isSupported: true, issues: [] });

  useEffect(() => {
    const checkEnvironment = () => {
      const issues: string[] = [];

      // Check for MediaDevices API
      if (!navigator?.mediaDevices?.getUserMedia) {
        issues.push("MediaDevices API not available");
      }

      // Check for WebRTC
      if (!(window.RTCPeerConnection || window.webkitRTCPeerConnection)) {
        issues.push("WebRTC not supported");
      }

      // Check for secure context
      if (!window.isSecureContext && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        issues.push("Secure context required (HTTPS)");
      }

      setStatus({
        isSupported: issues.length === 0,
        issues
      });
    };

    checkEnvironment();
  }, []);

  if (!status.isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-800 font-semibold mb-2">Environment Not Supported</h3>
        <p className="text-yellow-700 mb-2">
          Voice calls are not available in this environment. Issues detected:
        </p>
        <ul className="list-disc list-inside text-yellow-700 mb-3">
          {status.issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
        <p className="text-sm text-yellow-600">
          Please use a modern browser with microphone access over HTTPS.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};