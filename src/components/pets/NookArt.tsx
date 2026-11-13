// The nook art from the Me redesign, converted from SVG for react-native-svg. It is drawn for a 390x844 portrait
// nook; ArtSpace maps those coordinates into the 342x440 nook, so saved piece positions keep working.

import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { COLLECTION_SCENE_ART } from './collectionSceneArt';
import { Fx } from './Fx';

const ART_SCALE = 342 / 390;
/** The top of the 390x844 art that the nook shows. Above this is cut off. */
export const ART_TOP = 180;
export const ART_W = 390;
export const ART_H = 844;

/** Draws children in the art's own coordinates. */
export function ArtSpace({ children }: { children: React.ReactNode }) {
  return <G transform={`scale(${ART_SCALE}) translate(0 ${-ART_TOP})`}>{children}</G>;
}

function SceneNight() {
  return (
    <>
      <Rect width={390} height={844} fill="#0E1430" />
      <Fx kind="artTwinkle" delay={0}>
        <Circle cx={6} cy={110} r={1} fill="#F2E9D8" />
        <Circle cx={255} cy={251} r={1} fill="#F2E9D8" />
        <Circle cx={124} cy={392} r={1} fill="#F2E9D8" />
        <Circle cx={373} cy={533} r={1} fill="#F2E9D8" />
        <Circle cx={242} cy={204} r={1} fill="#F2E9D8" />
        <Circle cx={111} cy={345} r={1} fill="#F2E9D8" />
        <Circle cx={360} cy={486} r={1} fill="#F2E9D8" />
        <Circle cx={229} cy={157} r={1} fill="#F2E9D8" />
        <Circle cx={98} cy={298} r={1} fill="#F2E9D8" />
        <Circle cx={347} cy={439} r={1} fill="#F2E9D8" />
        <Circle cx={216} cy={110} r={1} fill="#F2E9D8" />
        <Circle cx={85} cy={251} r={1} fill="#F2E9D8" />
      </Fx>
      <Fx kind="artTwinkle" delay={900}>
        <Circle cx={89} cy={157} r={1.3} fill="#F2E9D8" />
        <Circle cx={338} cy={298} r={1.3} fill="#F2E9D8" />
        <Circle cx={207} cy={439} r={1.3} fill="#F2E9D8" />
        <Circle cx={76} cy={110} r={1.3} fill="#F2E9D8" />
        <Circle cx={325} cy={251} r={1.3} fill="#F2E9D8" />
        <Circle cx={194} cy={392} r={1.3} fill="#F2E9D8" />
        <Circle cx={63} cy={533} r={1.3} fill="#F2E9D8" />
        <Circle cx={312} cy={204} r={1.3} fill="#F2E9D8" />
        <Circle cx={181} cy={345} r={1.3} fill="#F2E9D8" />
        <Circle cx={50} cy={486} r={1.3} fill="#F2E9D8" />
        <Circle cx={299} cy={157} r={1.3} fill="#F2E9D8" />
      </Fx>
      <Fx kind="artTwinkle" delay={1800}>
        <Circle cx={172} cy={204} r={1.6} fill="#F2E9D8" />
        <Circle cx={41} cy={345} r={1.6} fill="#F2E9D8" />
        <Circle cx={290} cy={486} r={1.6} fill="#F2E9D8" />
        <Circle cx={159} cy={157} r={1.6} fill="#F2E9D8" />
        <Circle cx={28} cy={298} r={1.6} fill="#F2E9D8" />
        <Circle cx={277} cy={439} r={1.6} fill="#F2E9D8" />
        <Circle cx={146} cy={110} r={1.6} fill="#F2E9D8" />
        <Circle cx={15} cy={251} r={1.6} fill="#F2E9D8" />
        <Circle cx={264} cy={392} r={1.6} fill="#F2E9D8" />
        <Circle cx={133} cy={533} r={1.6} fill="#F2E9D8" />
        <Circle cx={382} cy={204} r={1.6} fill="#F2E9D8" />
      </Fx>
      <Path d="M318 214 A40 40 0 1 0 318 294 A30 30 0 1 1 318 214 Z" fill="#F4EED8" opacity={0.9} />
      <Path d="M0 600 Q195 552 390 600 L390 844 L0 844 Z" fill="#1A2448" />
      <Path d="M0 680 Q195 650 390 680 L390 844 L0 844 Z" fill="#202C54" />
    </>
  );
}

function SceneChapel() {
  return (
    <>
      <Rect width={390} height={844} fill="#2A2018" />
      <Rect x={0} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={130} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={156} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={182} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={208} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={234} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={260} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={286} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={312} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={338} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={364} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={390} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={416} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={442} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={468} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={494} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={520} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={546} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={-31} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={31} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={93} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={155} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={217} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={279} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={341} y={572} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={0} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={62} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={124} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={186} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={248} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={310} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Rect x={372} y={598} width={62} height={26} fill="none" stroke="#3A2C20" strokeWidth={2} />
      <Path d="M150 400 L150 300 Q195 236 240 300 L240 400 Z" fill="#F2C462" opacity={0.18} />
      <Path d="M150 400 L150 300 Q195 236 240 300 L240 400 Z M195 252 V400 M150 330 H240" fill="none" stroke="#6B4A2A" strokeWidth={5} />
      <Path d="M0 600 L390 600 L390 844 L0 844 Z" fill="#3A2C20" />
      <Path d="M0 600 H390" stroke="#4A3828" strokeWidth={4} />
    </>
  );
}

function SceneGrove() {
  return (
    <>
      <Rect width={390} height={844} fill="#18201E" />
      <Circle cx={304} cy={262} r={96} fill="#C9B86A" opacity={0.13} />
      <Path d="M0 600 Q195 548 390 600 L390 844 L0 844 Z" fill="#26392E" />
      <Path d="M0 680 Q195 650 390 680 L390 844 L0 844 Z" fill="#2B4234" />
      <Ellipse cx={120} cy={704} rx={34} ry={7} fill="#4A5A34" opacity={0.6} />
      <Ellipse cx={282} cy={724} rx={40} ry={8} fill="#4A5A34" opacity={0.6} />
    </>
  );
}

function SceneDesert() {
  return (
    <>
      <Rect width={390} height={844} fill="#231A3A" />
      <G transform="translate(300 230)">
        <Path d="M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z" fill="#FFF1C4" />
      </G>
      <Fx kind="artTwinkle" delay={0}>
        <Circle cx={6} cy={110} r={1.2} fill="#F2E9D8" />
        <Circle cx={297} cy={269} r={1.2} fill="#F2E9D8" />
        <Circle cx={208} cy={428} r={1.2} fill="#F2E9D8" />
        <Circle cx={119} cy={257} r={1.2} fill="#F2E9D8" />
        <Circle cx={30} cy={416} r={1.2} fill="#F2E9D8" />
        <Circle cx={321} cy={245} r={1.2} fill="#F2E9D8" />
      </Fx>
      <Fx kind="artTwinkle" delay={900}>
        <Circle cx={103} cy={163} r={1.2} fill="#F2E9D8" />
        <Circle cx={14} cy={322} r={1.2} fill="#F2E9D8" />
        <Circle cx={305} cy={151} r={1.2} fill="#F2E9D8" />
        <Circle cx={216} cy={310} r={1.2} fill="#F2E9D8" />
        <Circle cx={127} cy={139} r={1.2} fill="#F2E9D8" />
        <Circle cx={38} cy={298} r={1.2} fill="#F2E9D8" />
      </Fx>
      <Fx kind="artTwinkle" delay={1800}>
        <Circle cx={200} cy={216} r={1.2} fill="#F2E9D8" />
        <Circle cx={111} cy={375} r={1.2} fill="#F2E9D8" />
        <Circle cx={22} cy={204} r={1.2} fill="#F2E9D8" />
        <Circle cx={313} cy={363} r={1.2} fill="#F2E9D8" />
        <Circle cx={224} cy={192} r={1.2} fill="#F2E9D8" />
        <Circle cx={135} cy={351} r={1.2} fill="#F2E9D8" />
      </Fx>
      <Path d="M0 590 Q100 548 200 584 Q300 540 390 576 L390 844 L0 844 Z" fill="#4A3050" />
      <Path d="M0 660 Q130 620 260 656 Q330 640 390 650 L390 844 L0 844 Z" fill="#5E3E4A" />
    </>
  );
}

function PieceLantern() {
  return (
    <>
      <G transform="translate(92 0)">
        <Path d="M0 660 L0 470 Q0 450 20 450" stroke="#2A2A30" strokeWidth={5} fill="none" />
        <Fx kind="artSwing" ox={20} oy={452}>
          <Path d="M20 452 L20 462" stroke="#2A2A30" strokeWidth={2} />
          <Rect x={10} y={462} width={20} height={28} rx={3} fill="#FFE2A0" opacity={0.45} />
          <Fx kind="artFlicker" delay={0} ox={20} oy={486}>
            <Path d="M20 468 Q26 478 20 486 Q14 478 20 468 Z" fill="#F2A93B" />
          </Fx>
          <Path d="M10 462 H30 M10 490 H30 M10 462 V490 M30 462 V490" stroke="#2A2A30" strokeWidth={2.5} />
        </Fx>
      </G>
    </>
  );
}

function PieceTreeL() {
  return (
    <>
      <Fx kind="artSway" ox={46} oy={660}>
        <Path d="M46 660 L46 500" stroke="#3A2A20" strokeWidth={12} strokeLinecap="round" />
        <Circle cx={46} cy={470} r={58} fill="#3E5A44" />
        <Circle cx={22} cy={440} r={44} fill="#466A4E" />
        <Circle cx={76} cy={492} r={40} fill="#3A5440" />
        <Ellipse cx={36} cy={452} rx={7} ry={4} fill="#9CAF6A" />
        <Ellipse cx={66} cy={484} rx={7} ry={4} fill="#9CAF6A" />
      </Fx>
    </>
  );
}

function PieceTreeR() {
  return (
    <>
      <Fx kind="artSway" ox={346} oy={660}>
        <Path d="M346 660 L346 500" stroke="#3A2A20" strokeWidth={12} strokeLinecap="round" />
        <Circle cx={346} cy={470} r={58} fill="#3E5A44" />
        <Circle cx={370} cy={440} r={44} fill="#466A4E" />
        <Circle cx={316} cy={492} r={40} fill="#3A5440" />
        <Ellipse cx={336} cy={452} rx={7} ry={4} fill="#9CAF6A" />
        <Ellipse cx={366} cy={484} rx={7} ry={4} fill="#9CAF6A" />
      </Fx>
    </>
  );
}

function PieceBench() {
  return (
    <>
      <G transform="translate(306 612)">
        <Rect x={-44} y={0} width={88} height={10} rx={3} fill="#8A5A3C" />
        <Rect x={-44} y={-26} width={88} height={8} rx={3} fill="#8A5A3C" />
        <Path d="M-36 10 V36 M36 10 V36 M-36 -18 V0 M36 -18 V0" stroke="#6B4A2A" strokeWidth={5} />
      </G>
    </>
  );
}

function PieceCross() {
  return (
    <>
      <Path d="M195 250 V350 M168 280 H222" stroke="#8A5A3C" strokeWidth={14} strokeLinecap="round" />
      <Path d="M195 250 V350" stroke="#A8784E" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
    </>
  );
}

function PieceRose() {
  return (
    <>
      <G transform="translate(195 230)">
        <Fx kind="spin" dur={18000}>
          <Path d="M0 0 L40.0 0.0 A40 40 0 0 1 28.3 28.3 Z" fill="#C9433A" opacity={0.75} />
          <Path d="M0 0 L28.3 28.3 A40 40 0 0 1 0.0 40.0 Z" fill="#3E6FC8" opacity={0.75} />
          <Path d="M0 0 L0.0 40.0 A40 40 0 0 1 -28.3 28.3 Z" fill="#F2C462" opacity={0.75} />
          <Path d="M0 0 L-28.3 28.3 A40 40 0 0 1 -40.0 0.1 Z" fill="#5FBF8A" opacity={0.75} />
          <Path d="M0 0 L-40.0 0.1 A40 40 0 0 1 -28.3 -28.2 Z" fill="#C9433A" opacity={0.75} />
          <Path d="M0 0 L-28.3 -28.2 A40 40 0 0 1 -0.1 -40.0 Z" fill="#3E6FC8" opacity={0.75} />
          <Path d="M0 0 L-0.1 -40.0 A40 40 0 0 1 28.2 -28.4 Z" fill="#F2C462" opacity={0.75} />
          <Path d="M0 0 L28.2 -28.4 A40 40 0 0 1 40.0 -0.1 Z" fill="#5FBF8A" opacity={0.75} />
        </Fx>
        <Circle r={41} fill="none" stroke="#C9A24B" strokeWidth={4} />
        <Circle r={10} fill="#FFF1C4" />
      </G>
    </>
  );
}

function PieceLights() {
  return (
    <>
      <Path d="M0 150 Q195 230 390 150" stroke="#3A3A44" strokeWidth={2} fill="none" />
      <Fx kind="artBulb" delay={0}>
        <Circle cx={20} cy={164} r={5} fill="#F2C462" />
        <Circle cx={122} cy={190} r={5} fill="#F2C462" />
        <Circle cx={224} cy={195} r={5} fill="#F2C462" />
        <Circle cx={326} cy={178} r={5} fill="#F2C462" />
      </Fx>
      <Fx kind="artBulb" delay={665}>
        <Circle cx={54} cy={175} r={5} fill="#F7A7BC" />
        <Circle cx={156} cy={194} r={5} fill="#F7A7BC" />
        <Circle cx={258} cy={192} r={5} fill="#F7A7BC" />
        <Circle cx={360} cy={167} r={5} fill="#F7A7BC" />
      </Fx>
      <Fx kind="artBulb" delay={1330}>
        <Circle cx={88} cy={184} r={5} fill="#8EC9F0" />
        <Circle cx={190} cy={196} r={5} fill="#8EC9F0" />
        <Circle cx={292} cy={186} r={5} fill="#8EC9F0" />
      </Fx>
    </>
  );
}

function PieceDove() {
  return (
    <>
      <Fx kind="artSwing" ox={300} oy={110}>
        <Path d="M300 110 V196" stroke="#C9C0AF" strokeWidth={1.4} />
        <Path d="M276 210 Q288 194 304 202 Q314 188 330 188 Q318 200 318 210 Q314 224 294 224 Q282 224 276 210 Z" fill="#F7F5F0" />
        <Circle cx={285} cy={208} r={2} fill="#1A2230" />
      </Fx>
    </>
  );
}

function PiecePrayerweb() {
  return (
    <>
      <G stroke="#C9D8C9" strokeOpacity={0.18} fill="none" strokeWidth={1.2}>
        <Path d="M195 470 L555 470" />
        <Path d="M195 470 L507 650" />
        <Path d="M195 470 L375 782" />
        <Path d="M195 470 L195 830" />
        <Path d="M195 470 L15 782" />
        <Path d="M195 470 L-117 650" />
        <Path d="M195 470 L-165 470" />
        <Path d="M195 470 L-117 290" />
        <Path d="M195 470 L15 158" />
        <Path d="M195 470 L195 110" />
        <Path d="M195 470 L375 158" />
        <Path d="M195 470 L507 290" />
        <Path d="M265 470 Q253 486 256 505 Q238 513 230 531 Q211 528 195 540 Q179 528 160 531 Q152 513 134 505 Q137 486 125 470 Q137 454 134 435 Q152 427 160 409 Q179 412 195 400 Q211 412 230 409 Q238 427 256 435 Q253 454 265 470" />
        <Path d="M325 470 Q303 499 308 535 Q274 549 260 583 Q224 578 195 600 Q166 578 130 583 Q116 549 82 535 Q87 499 65 470 Q87 441 82 405 Q116 391 130 357 Q166 362 195 340 Q224 362 260 357 Q274 391 308 405 Q303 441 325 470" />
        <Path d="M395 470 Q361 515 368 570 Q317 592 295 643 Q240 636 195 670 Q150 636 95 643 Q73 592 22 570 Q29 515 -5 470 Q29 425 22 370 Q73 348 95 297 Q150 304 195 270 Q240 304 295 297 Q317 348 368 370 Q361 425 395 470" />
        <Path d="M475 470 Q428 532 437 610 Q365 640 335 712 Q257 703 195 750 Q133 703 55 712 Q25 640 -47 610 Q-38 532 -85 470 Q-38 408 -47 330 Q25 300 55 228 Q133 237 195 190 Q257 237 335 228 Q365 300 437 330 Q428 408 475 470" />
      </G>
    </>
  );
}

function ThumbLantern() {
  return (
    <>
      <Path d="M12 38 V12 Q12 8 18 8" stroke="#2A2A30" strokeWidth={2.4} fill="none" />
      <Rect x={16} y={12} width={12} height={16} rx={2} fill="#FFE2A0" />
      <Path d="M22 16 Q25 20 22 24 Q19 20 22 16 Z" fill="#F2A93B" />
    </>
  );
}

function ThumbTreeL() {
  return (
    <>
      <Path d="M20 36 V22" stroke="#3A2A20" strokeWidth={4} />
      <Circle cx={20} cy={16} r={11} fill="#466A4E" />
      <Circle cx={14} cy={20} r={7} fill="#3E5A44" />
    </>
  );
}

function ThumbTreeR() {
  return (
    <>
      <Path d="M20 36 V22" stroke="#3A2A20" strokeWidth={4} />
      <Circle cx={20} cy={16} r={11} fill="#466A4E" />
      <Circle cx={26} cy={20} r={7} fill="#3E5A44" />
    </>
  );
}

function ThumbBench() {
  return (
    <>
      <Rect x={6} y={18} width={28} height={4} rx={1} fill="#8A5A3C" />
      <Rect x={6} y={10} width={28} height={3} rx={1} fill="#8A5A3C" />
      <Path d="M9 22 V32 M31 22 V32" stroke="#6B4A2A" strokeWidth={2.4} />
    </>
  );
}

function ThumbCross() {
  return (
    <>
      <Path d="M20 6 V34 M12 14 H28" stroke="#8A5A3C" strokeWidth={5} strokeLinecap="round" />
    </>
  );
}

function ThumbRose() {
  return (
    <>
      <Circle cx={20} cy={20} r={14} fill="#3E6FC8" />
      <Path d="M20 6 V34 M6 20 H34 M10 10 L30 30 M30 10 L10 30" stroke="#2A2A30" strokeWidth={1.6} />
      <Circle cx={20} cy={20} r={14} fill="none" stroke="#C9A24B" strokeWidth={2} />
      <Circle cx={20} cy={20} r={4} fill="#F2C462" />
    </>
  );
}

function ThumbLights() {
  return (
    <>
      <Path d="M2 10 Q20 26 38 10" stroke="#3A3A44" strokeWidth={1.4} fill="none" />
      <Circle cx={10} cy={19} r={3} fill="#F2C462" />
      <Circle cx={20} cy={22} r={3} fill="#F7A7BC" />
      <Circle cx={30} cy={19} r={3} fill="#8EC9F0" />
    </>
  );
}

function ThumbDove() {
  return (
    <>
      <Path d="M20 2 V14" stroke="#C9C0AF" strokeWidth={1} />
      <Path d="M8 24 Q14 16 22 20 Q27 12 35 12 Q29 18 29 24 Q27 31 17 31 Q11 31 8 24 Z" fill="#F7F5F0" />
    </>
  );
}

function ThumbPrayerweb() {
  return (
    <>
      <G stroke="#C9D8C9" strokeWidth={1} fill="none">
        <Path d="M20 20 L20 2 M20 20 L36 12 M20 20 L36 30 M20 20 L20 38 M20 20 L4 30 M20 20 L4 12" />
        <Circle cx={20} cy={20} r={7} />
        <Circle cx={20} cy={20} r={13} />
      </G>
    </>
  );
}

const SCENES: Record<string, () => React.JSX.Element> = {
  night: SceneNight,
  chapel: SceneChapel,
  grove: SceneGrove,
  desert: SceneDesert,
  ...COLLECTION_SCENE_ART,
};

const PIECES: Record<string, () => React.JSX.Element> = {
  lantern: PieceLantern,
  treeL: PieceTreeL,
  treeR: PieceTreeR,
  bench: PieceBench,
  cross: PieceCross,
  rose: PieceRose,
  lights: PieceLights,
  dove: PieceDove,
  prayerweb: PiecePrayerweb,
};

const THUMBS: Record<string, () => React.JSX.Element> = {
  lantern: ThumbLantern,
  treeL: ThumbTreeL,
  treeR: ThumbTreeR,
  bench: ThumbBench,
  cross: ThumbCross,
  rose: ThumbRose,
  lights: ThumbLights,
  dove: ThumbDove,
  prayerweb: ThumbPrayerweb,
};

export function hasArtScene(id: string): boolean {
  return id in SCENES;
}

export function hasArtPiece(id: string): boolean {
  return id in PIECES;
}

export function hasArtThumb(id: string): boolean {
  return id in THUMBS;
}

export function ArtScene({ id }: { id: string }) {
  const Scene = SCENES[id];
  return <ArtSpace><Scene /></ArtSpace>;
}

export function ArtPiece({ id }: { id: string }) {
  const Piece = PIECES[id];
  return <ArtSpace><Piece /></ArtSpace>;
}

/** A 40x40 tile icon, sized for CosmeticIcon's 32x32 box. */
export function ArtThumb({ id }: { id: string }) {
  const Thumb = THUMBS[id];
  return <G transform="scale(0.8)"><Thumb /></G>;
}

/**
 * The whole 390x844 scene, for the full-screen decorator. The Prayer web is drawn here too, because it reaches past
 * the part of the art the nook shows. `webOffset` is in nook units.
 */
/** Memoized: it's a full-screen drawing, and the decorator re-renders often around it. */
export const ArtFullScene = memo(function ArtFullScene({ id, web, webOffset, width, height }: {
  id: string;
  web: boolean;
  webOffset: { x: number; y: number };
  width: number;
  height: number;
}) {
  const Scene = SCENES[id];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {Scene ? <Scene /> : null}
      {web ? <G opacity={0.25} transform={`translate(${webOffset.x / ART_SCALE} ${webOffset.y / ART_SCALE})`}><PiecePrayerweb /></G> : null}
    </Svg>
  );
});
