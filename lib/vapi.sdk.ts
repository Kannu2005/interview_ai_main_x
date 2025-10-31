import Vapi from "@vapi-ai/web";

// VAPI Web SDK requires a Web Token (public key), not the API key (private key)
// Get this from your VAPI dashboard: Settings > API Keys > Web Token
const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN || "c0f7ca7f-2a7a-48ef-9df4-79f351c058d2";

// Check if we're in a supported environment
const isSupported = () => {
  if (typeof window === "undefined") return false;
  
  // Check for required APIs
  const hasMediaDevices = !!(navigator?.mediaDevices?.getUserMedia);
  const hasWebRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
  const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  
  return hasMediaDevices && hasWebRTC && isSecureContext;
};

let vapi: Vapi | null = null;

// Only initialize VAPI in supported environments
if (typeof window !== "undefined") {
  if (!vapiToken || vapiToken === "") {
    console.warn("⚠️ VAPI Web Token is not set. Calls will fail.");
  } else if (!isSupported()) {
    console.warn("⚠️ VAPI is not supported in this environment. Missing WebRTC, MediaDevices, or secure context.");
  } else {
    try {
      vapi = new Vapi(vapiToken);
      console.log("✅ VAPI Web Token loaded:", vapiToken.substring(0, 8) + "...");
    } catch (error) {
      console.error("❌ Failed to initialize VAPI:", error);
    }
  }
}

export { vapi };
