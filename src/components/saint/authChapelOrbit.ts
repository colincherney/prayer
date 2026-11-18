export type ChapelOrbit = { azimuth: number; elevation: number };

export const CHAPEL_CAMERA_ASPECT = 1.11;
export const DEFAULT_CHAPEL_ORBIT: ChapelOrbit = { azimuth: 0.49, elevation: 0.29 };

export function dragChapelOrbit(start: ChapelOrbit, dx: number, dy: number, width: number, height: number): ChapelOrbit {
  'worklet';
  return {
    azimuth: start.azimuth - dx * Math.PI / width,
    elevation: Math.max(0.06, Math.min(0.86, start.elevation + dy * Math.PI / (height * 2))),
  };
}
