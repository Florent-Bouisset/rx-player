/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import isNode from "./is_node";

// true on IE11
// false on Edge and other IEs/browsers.
const isIE11 : boolean = !isNode &&
                         !!(window as any).MSInputMethodContext &&
                         !!(document as any).documentMode;

// true for IE / Edge
const isIEOrEdge : boolean = isNode ?
  false :
  navigator.appName === "Microsoft Internet Explorer" ||
  navigator.appName === "Netscape" &&
  /(Trident|Edge)\//.test(navigator.userAgent);

const isEdgeChromium: boolean = !isNode &&
                                navigator.userAgent.toLowerCase().indexOf("edg/") !== -1;

const isFirefox : boolean = !isNode &&
                            navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;

const isSamsungBrowser : boolean = !isNode &&
                                   /SamsungBrowser/.test(navigator.userAgent);

const isSafari : boolean =
  !isNode && (
    /* tslint:disable ban */
    Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") >= 0 ||
    /* tslint:enable ban */
    /* tslint:disable no-unsafe-any */
    (window as any).safari?.pushNotification.toString() ===
      "[object SafariRemoteNotification]"
    /* tslint:enable no-unsafe-any */
  );

const isSafariMobile : boolean = !isNode &&
                                 typeof navigator.platform === "string" &&
                                 /iPad|iPhone|iPod/.test(navigator.platform);

export {
  isEdgeChromium,
  isIE11,
  isIEOrEdge,
  isFirefox,
  isSafari,
  isSafariMobile,
  isSamsungBrowser,
};
