import { brandBlue } from '@/shared/theme/colors';
import Svg, { Path, Rect } from 'react-native-svg';

type AppLogoProps = {
  width?: number;
  color?: string;
};

const VIEWBOX_WIDTH = 826;
const VIEWBOX_HEIGHT = 288;

export function AppLogo({ width = 64, color = brandBlue }: AppLogoProps) {
  const height = (width * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} fill="none">
      <Rect y="200" width="135" height="84" rx="20" fill={color} />
      <Rect width="235" height="174" rx="20" fill={color} />
      <Path
        d="M263 20C263 8.95431 271.954 0 283 0H478C489.046 0 498 8.95431 498 20V23.4879C498 30.6145 494.208 37.2027 488.045 40.7822L293.045 154.048C279.712 161.793 263 152.173 263 136.754V20Z"
        fill={color}
      />
      <Path
        d="M322.139 159.749C328.761 155.634 337.17 155.742 343.684 160.026L490.243 256.399C495.085 259.583 498 264.989 498 270.784C498 280.292 490.292 288 480.784 288H283C271.954 288 263 279.046 263 268V207.619C263 200.705 266.571 194.281 272.444 190.631L322.139 159.749Z"
        fill={color}
      />
      <Path
        d="M716.208 288C703.986 288 694.622 277.135 696.427 265.047L733.455 17.0466C734.918 7.25015 743.331 0 753.236 0L806 0C817.046 0 826 8.95432 826 20V268C826 279.046 817.046 288 806 288L716.208 288Z"
        fill={color}
      />
      <Path
        d="M641.637 288C653.912 288 663.291 277.045 661.398 264.916L622.7 16.9165C621.18 7.17914 612.794 0 602.939 0L546 0C534.954 0 526 8.95432 526 20V268C526 279.046 534.954 288 546 288L641.637 288Z"
        fill={color}
      />
    </Svg>
  );
}
