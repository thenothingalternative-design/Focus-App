import {NativeModules, Platform} from 'react-native';

const {Blocker} = NativeModules;
const isAndroid = Platform.OS === 'android' && !!Blocker;

export const BLOCK_LIST = [
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.google.android.youtube',
  'com.twitter.android',
  'com.reddit.frontpage',
  'com.facebook.katana',
];

export const setBlocking = (on: boolean) => {
  if (isAndroid) Blocker.setBlocking(on, BLOCK_LIST);
};
export const isAccessibilityEnabled = async (): Promise<boolean> =>
  isAndroid ? Blocker.isAccessibilityEnabled() : false;
export const openAccessibilitySettings = () => {
  if (isAndroid) Blocker.openAccessibilitySettings();
};
