import log from "../../log";
import type { IMainThreadMessage } from "../../multithread_types";

export default function sendMessage(
  worker: Worker,
  msg: IMainThreadMessage,
  transferables?: Transferable[],
): void {
  // eslint-disable-next-line no-console
  console.log("DEBUG FLORENT: sending message to worker", worker);
  log.debug("---> Sending to Worker:", msg.type);
  if (transferables === undefined) {
    worker.postMessage(msg);
  } else {
    worker.postMessage(msg, transferables);
  }
}
