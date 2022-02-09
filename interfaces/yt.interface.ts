export type OutgoingYtMessages =
  | GetYtInit
  | SetYtFullscreen
  | SetYtPlay
  | SetYtSeek;
export type IncomingYtMessages = Fullscreen | Init | Play | Pause | Visibility;

export interface GetYtInit {
  type: 'getInit';
}

export function getYtInit(): GetYtInit {
  return { type: 'getInit' };
}

export interface SetYtFullscreen {
  type: 'setFullscreen';
}

export function setYtFullscreen(): SetYtFullscreen {
  return { type: 'setFullscreen' };
}

export interface SetYtSeek {
  type: 'setSeek';
  seek: number;
}

export function setYtSeek(seek: number): SetYtSeek {
  return { type: 'setSeek', seek };
}

export interface SetYtPlay {
  type: 'setPlay';
}

export function setYtPlay(): SetYtPlay {
  return { type: 'setPlay' };
}

export interface Fullscreen {
  type: 'fullscreen';
  fullscreen: boolean;
}

export function isFullscreen(
  msg: IncomingYtMessages | OutgoingYtMessages,
): msg is Fullscreen {
  return msg.type === 'fullscreen';
}

export interface Init {
  type: 'init';
  time: number;
  duration: number;
  paused: boolean;
  title: string;
  fullscreen: boolean;
}

export function isInit(
  msg: IncomingYtMessages | OutgoingYtMessages,
): msg is Init {
  return msg.type === 'init';
}

export interface Play {
  type: 'play';
  time: number;
  duration: number;
}

export function isPlay(
  msg: IncomingYtMessages | OutgoingYtMessages,
): msg is Play {
  return msg.type === 'play';
}

export interface Pause {
  type: 'pause';
  time: number;
}

export function isPause(
  msg: IncomingYtMessages | OutgoingYtMessages,
): msg is Pause {
  return msg.type === 'pause';
}

export interface Visibility {
  type: 'visibility';
  hidden: boolean;
  time: number;
  duration: number;
  paused: boolean;
  title: string;
  fullscreen: boolean;
}

export function isVisibility(
  msg: IncomingYtMessages | OutgoingYtMessages,
): msg is Visibility {
  return msg.type === 'visibility';
}
