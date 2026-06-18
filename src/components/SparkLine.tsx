import React, {useMemo} from 'react';
import {View} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';
import {Colors} from '../theme';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export function SparkLine({
  data,
  width = 80,
  height = 36,
  positive,
}: Props) {
  const color = positive === undefined
    ? Colors.textSecondary
    : positive
    ? Colors.positive
    : Colors.negative;

  const path = useMemo(() => {
    if (!data || data.length < 2) {
      return '';
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const w = width;
    const h = height - pad * 2;

    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [data, width, height]);

  const fillPath = useMemo(() => {
    if (!path) {
      return '';
    }
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  if (!data || data.length < 2) {
    return <View style={{width, height}} />;
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill="url(#sparkGrad)" />
      <Path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
