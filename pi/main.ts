import { filter, take } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import {
  isPropertyInspectorDidDisappear,
} from '../interfaces/incoming.interfaces';
import {
  ActionInfo,
  IncomingMessages,
  OutgoingMessages,
} from '../interfaces/interfaces';
import {
  registerPropertyInspector,
  setSettings,
} from '../interfaces/outgoing.interfaces';

export let ws: WebSocketSubject<IncomingMessages | OutgoingMessages> | null =
  null;

function connectElgatoStreamDeckSocket(
  inPort: string,
  inPluginUUID: string,
  inRegisterEvent: 'registerPropertyInspector',
  inInfo: unknown,
  inActionInfo: string,
) {
  ws = webSocket<IncomingMessages | OutgoingMessages>(
    `ws://127.0.0.1:${inPort}`,
  );
  const actionInfo: ActionInfo = JSON.parse(inActionInfo);
  const settings = actionInfo.payload.settings;
  console.log(actionInfo);
  if (actionInfo.action === 'eu.stumpa.telka.info') {
    document.getElementsByClassName('sdpi-wrapper')[1].removeAttribute('style');

    const program = document.getElementById('program') as HTMLInputElement;
    program.value = actionInfo.payload.settings.channelId || '';
  }

  if (actionInfo.action === 'eu.stumpa.youtubko.seek') {
    document.getElementsByClassName('sdpi-wrapper')[0].removeAttribute('style');

    const label = document.getElementById('label');
    label!.innerText = 'Posunout video o X sekund';

    const value = document.getElementById('value') as HTMLInputElement;
    value.min = '-100';
    value.max = '100';
    value.value = settings.seek ?? '';

    value.onchange = () => {
      const seek = +value.value;
      if (!(-100 <= seek && seek <= 100)) return;

      const newSettings = { ...settings, seek };

      ws?.next(setSettings(inPluginUUID, newSettings));
    };
  }

  ws.next(registerPropertyInspector(inRegisterEvent, inPluginUUID));
  ws.pipe(filter(isPropertyInspectorDidDisappear), take(1)).subscribe();
}

(window as any)['connectElgatoStreamDeckSocket'] =
  connectElgatoStreamDeckSocket;
