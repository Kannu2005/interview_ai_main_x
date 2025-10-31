export const checkAudioPermissions = async (): Promise<{
  granted: boolean;
  error?: string;
}> => {
  try {
    // Check if MediaDevices API is available
    if (!navigator?.mediaDevices?.getUserMedia) {
      return {
        granted: false,
        error: "MediaDevices API not available in this browser"
      };
    }

    // Try to get microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Clean up the stream
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true };
  } catch (error: any) {
    let errorMessage = "Unknown error";
    
    if (error.name === "NotAllowedError") {
      errorMessage = "Microphone access denied by user";
    } else if (error.name === "NotFoundError") {
      errorMessage = "No microphone found";
    } else if (error.name === "NotSupportedError") {
      errorMessage = "Microphone not supported in this browser";
    } else if (error.name === "SecurityError") {
      errorMessage = "Security error - ensure you're on HTTPS";
    }
    
    return {
      granted: false,
      error: errorMessage
    };
  }
};

export const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error("Failed to enumerate audio devices:", error);
    return [];
  }
};