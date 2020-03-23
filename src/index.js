import PubcidHandler from './lib/pubcidHandler';
import {getCookie, delCookie, clearAllCookies, setCookie, isCookieSupported} from './lib/cookieUtils'
import {isStorageSupported, getStorageItem, setStorageItem, removeStorageItem, clearStorage} from './lib/storageUtils';
import ConsentHandler from "./lib/consenthandler/consentHandler";

module.exports = {
  PubcidHandler,
  ConsentHandler,
  getCookie,
  setCookie,
  delCookie,
  clearAllCookies,
  isCookieSupported,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  isStorageSupported
};
