import { useEffect, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';

export interface CameraInfo {
  hasCamera: boolean;
  isLoading: boolean;
  error: string | null;
  cameraCount: number;
}

/**
 * @description Detects if the user has a camera on their device
 * @returns The camera information { hasCamera, isLoading, error, cameraCount }
 */
export const useCameraDetection = (): CameraInfo => {
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>({
    hasCamera: false,
    isLoading: true,
    error: null,
    cameraCount: 0,
  });

  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if MediaDevices API is supported
        if (typeof navigator.mediaDevices === 'undefined') {
          setCameraInfo({
            hasCamera: false,
            isLoading: false,
            error: 'MediaDevices API not supported',
            cameraCount: 0,
          });
          return;
        }

        // Enumerate all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter video input devices (cameras)
        const cameras = devices.filter((device) => device.kind === 'videoinput');

        setCameraInfo({
          hasCamera: cameras.length > 0,
          isLoading: false,
          error: null,
          cameraCount: cameras.length,
        });
      } catch (error) {
        logBonsaiError('useCameraDetection', 'Error checking for camera', { error });

        setCameraInfo({
          hasCamera: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          cameraCount: 0,
        });
      }
    };

    checkCamera();
  }, []);

  return cameraInfo;
};
