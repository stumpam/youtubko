import { filter, Subscription, tap } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import {
  isKeyUp,
  isWillAppear,
  isWillDisappear,
  WillAppear,
  WillDisappear,
} from './interfaces/incoming.interfaces';
import { IncomingMessages, OutgoingMessages } from './interfaces/interfaces';
import {
  registerPlugin,
  setImage,
  setState,
} from './interfaces/outgoing.interfaces';
import {
  getYtInit,
  IncomingYtMessages,
  Init,
  isFullscreen,
  isInit,
  isPause,
  isPlay,
  isVisibility,
  OutgoingYtMessages,
  Pause,
  Play,
  setYtFullscreen,
  setYtPlay,
  setYtSeek,
  Visibility,
} from './interfaces/yt.interface';

export let ws: WebSocketSubject<IncomingMessages | OutgoingMessages> | null =
  null;
export let yt: WebSocketSubject<
  IncomingYtMessages | OutgoingYtMessages
> | null = null;
let ytData: Omit<Init, 'type'> = {} as Init;
let interval: number | undefined;

function connectElgatoStreamDeckSocket(
  inPort: string,
  inPluginUUID: string,
  inRegisterEvent: 'registerPlugin',
) {
  ws = webSocket(`ws://127.0.0.1:${inPort}`);
  yt = webSocket(`ws://127.0.0.1:2292`);

  let actions: WillAppear[] = [];

  let subs: Subscription | undefined;

  ws.pipe(
    filter(isKeyUp),
    tap((msg) => {
      const commands = {
        'eu.stumpa.youtubko.fullscreen': setYtFullscreen(),
        'eu.stumpa.youtubko.seek': setYtSeek(msg.payload.settings.seek || 5),
        'eu.stumpa.youtubko.play': setYtPlay(),
      };

      const prep = commands[msg.action as keyof typeof commands];
      if (prep) {
        yt?.next(prep);
      }

      if (msg.action === 'eu.stumpa.youtubko.fullscreen') {
        ws?.next(setState(msg as any, msg.payload.state));

        return;
      }

      if (msg.action === 'eu.stumpa.youtubko.seek') {
        ytData.time += msg.payload.settings.seek || 5;
        if (ytData.time < 0) {
          ytData.time = 0;
        }

        const action = actions.find(
          (a) => a.action === 'eu.stumpa.youtubko.play',
        );
        if (!action) return;
        nowPlaying(action, {} as Play);
      }
    }),
  ).subscribe();

  ws.pipe(filter((msg) => isWillAppear(msg) || isWillDisappear(msg))).subscribe(
    (msg) => {
      if (isWillAppear(msg)) {
        actions.push(msg);

        if (msg.action === 'eu.stumpa.youtubko.play') {
          notOnYt(msg);
        }

        if (actions.length === 1) {
          setTimeout(() => yt?.next(getYtInit()));
          const sub = yt?.subscribe({
            next: (ytMsg) => {
              if (isFullscreen(ytMsg)) {
                setFullscreen(ytMsg.fullscreen);
              }

              if (isInit(ytMsg)) {
                setFullscreen(ytMsg.fullscreen);

                const action = actions.find(
                  (a) => a.action === 'eu.stumpa.youtubko.play',
                );

                if (!action) return;

                nowPlaying(action, ytMsg);
                return;
              }

              if (isPlay(ytMsg)) {
                const action = actions.find(
                  (a) => a.action === 'eu.stumpa.youtubko.play',
                );

                if (!action) return;

                clearInterval(interval);

                startPlaying(action, ytMsg);
                return;
              }

              if (isPause(ytMsg)) {
                const action = actions.find(
                  (a) => a.action === 'eu.stumpa.youtubko.play',
                );
                if (!action) return;

                clearInterval(interval);

                nowPlaying(action, ytMsg);
                return;
              }

              if (isVisibility(ytMsg)) {
                const action = actions.find(
                  (a) => a.action === 'eu.stumpa.youtubko.play',
                );
                if (!action) return;

                clearInterval(interval);
                if (ytMsg.hidden) {
                  notOnYt(action as any);
                } else {
                  if (ytMsg.paused) {
                    nowPlaying(action, ytMsg);
                  } else {
                    startPlaying(action, ytMsg);
                  }
                }

                return;
              }
            },
            complete: () => {},
          });

          subs?.add(sub);
        }
      } else {
        actions = actions.filter(
          (act) => act.action === (msg as WillDisappear).action,
        );

        if (!actions.length) {
          subs?.unsubscribe();
        }
      }
    },
  );

  function setFullscreen(value: boolean) {
    const action = actions.find(
      (a) => a.action === 'eu.stumpa.youtubko.fullscreen',
    );

    if (!action) return;

    ws?.next(setState(action, +value));
  }

  ws.next(registerPlugin(inRegisterEvent, inPluginUUID));
}

function nowPlaying(
  action: WillAppear,
  yt: Init | Play | Pause | Visibility,
): void {
  ytData = { ...ytData, ...yt };

  if (!ytData.title) {
    notOnYt(action);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 144;

  const ctx = canvas.getContext('2d')!;
  ctx.font = '20px Arial';
  ctx.fillStyle = '#FFF';

  const longTitle = ytData.title.length > 13;

  ctx.fillText(ytData.title.slice(0, 13).trim(), 8, 25);

  if (longTitle) {
    ctx.fillText(ytData.title.slice(13).trim(), 8, 45);
  }

  ctx.font = '40px Arial';
  const timeText = format(ytData.time);
  const timeMeasure = ctx.measureText(timeText);
  ctx.fillText(timeText, calculateWidth(timeMeasure), 90);

  ctx.font = '30px Arial';
  const durationText = format(ytData.duration);
  const durationMeasure = ctx.measureText(durationText);
  ctx.fillText(durationText, calculateWidth(durationMeasure), 125);

  const img = canvas.toDataURL();

  ws?.next(setImage(action, img));
}

function notOnYt(action: WillAppear): void {
  ytData = {} as Omit<Init, 'type'>;

  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  ctx.font = '700 75px Arial';
  ctx.fillStyle = '#fff';
  const timeText = 'YT';
  const timeMeasure = ctx.measureText(timeText);
  ctx.fillText(timeText, calculateWidth(timeMeasure), 100);
  const img = canvas.toDataURL();

  ws?.next(setImage(action, img));
}

function startPlaying(action: WillAppear, play?: Play | Visibility) {
  nowPlaying(action, play || ({} as Play));

  interval = setInterval(() => {
    nowPlaying(action, {
      type: 'play',
      time: ytData.time + 1,
      duration: ytData.duration,
    });
  }, 1000);
}

function calculateWidth(text: TextMetrics): number {
  return 144 / 2 - text.width / 2;
}

(window as any)['connectElgatoStreamDeckSocket'] =
  connectElgatoStreamDeckSocket;

function format(time: number): string {
  // Hours, minutes and seconds
  const hrs = ~~(time / 3600);
  const mins = ~~((time % 3600) / 60);
  const secs = ~~time % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = '';
  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }
  ret += '' + mins + ':' + (secs < 10 ? '0' : '');
  ret += '' + secs;
  return ret;
}
