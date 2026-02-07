import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getTestProps } from '../utils/qa';

const PRESET_USERS = ['standard_user', 'locked_out_user', 'problem_user'];

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const setToken = useAppStore((s) => s.setToken);
  const country = useAppStore((s) => s.country);

  const handleLogin = () => {
    // Simulación de Auth exitosa para demo
    if (username === 'locked_out_user') {
       alert("User is locked out!");
       return;
    }
    setToken('fake-jwt-token');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OmniPizza Login ({country})</Text>
      
      {/* Quick Fill Buttons for QA */}
      <View style={styles.presets}>
        {PRESET_USERS.map(u => (
          <TouchableOpacity 
            key={u} 
            onPress={() => { setUsername(u); setPassword('pizza123'); }}
            style={styles.presetBtn}
            {...getTestProps(`btn-preset-${u}`)}
          >
            <Text style={styles.presetText}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        {...getTestProps('input-username')}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        {...getTestProps('input-password')}
      />
      
      <Button 
        title="Login" 
        onPress={handleLogin} 
        {...getTestProps('btn-login')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 5 },
  presetBtn: { backgroundColor: '#eee', padding: 5, borderRadius: 4 },
  presetText: { fontSize: 10 }
});