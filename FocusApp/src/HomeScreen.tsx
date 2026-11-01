import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Button, StyleSheet, Text, View} from 'react-native';
import {useSession} from './useSession';
import {isAccessibilityEnabled, openAccessibilitySettings} from './blocker';

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const {connected, active, remainingMs, start, stop, error} = useSession();
  const [a11y, setA11y] = useState(true);

  const check = useCallback(() => {
    isAccessibilityEnabled().then(setA11y);
  }, []);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', s => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{connected ? '● Connected' : '○ Offline'}</Text>
      <Text style={styles.timer}>{active ? fmt(remainingMs) : 'No session'}</Text>
      {active ? (
        <Button title="Stop session" onPress={stop} color="#c0392b" />
      ) : (
        <Button title="Start 25 min focus" onPress={start} disabled={!connected} />
      )}
      {!a11y && (
        <View style={styles.warn}>
          <Text>Enable the Focus accessibility service so apps can be blocked.</Text>
          <Button title="Open settings" onPress={openAccessibilitySettings} />
        </View>
      )}
      {error && <Text style={styles.err}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24},
  status: {fontSize: 14},
  timer: {fontSize: 56, fontWeight: '600'},
  warn: {marginTop: 24, gap: 8, alignItems: 'center'},
  err: {color: 'red', fontSize: 12},
});
