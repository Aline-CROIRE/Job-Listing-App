import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/jobnest-logo.png')}
        style={styles.logo}
      />

      <Text style={styles.header}>Create a Job Nest account</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#888"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          style={[styles.input, { flex: 1 }]}
          secureTextEntry={hidePassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setHidePassword(!hidePassword)}>
          <Text style={styles.toggle}>{hidePassword ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          style={[styles.input, { flex: 1 }]}
          secureTextEntry={hideConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Pressable onPress={() => setHideConfirm(!hideConfirm)}>
          <Text style={styles.toggle}>{hideConfirm ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginPrompt}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  header: {
    fontSize: 20,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 18,
    width: '90%',
  },
//   icon: {
//     fontSize: 18,
//     color: '#ccc',
//     marginRight: 8,
//   },
  toggle: {
    color: '#28a745',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  loginRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginPrompt: {
    color: '#ccc',
    fontSize: 14,
  },
  loginLink: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 14,
  },
});
