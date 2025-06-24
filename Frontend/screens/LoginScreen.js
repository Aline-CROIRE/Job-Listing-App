import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/jobnest-logo.png')}
        style={styles.logo}
      />
      <Text style={styles.tagline}>
        Welcome to Job Nest! Please login to continue.
      </Text>

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

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={styles.registerPrompt}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}> Register</Text>
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
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
    borderRadius:10,
  },
  tagline: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 18,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
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
  linkRow: {
    width: '90%',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  forgotText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '500',
  },
  registerRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerPrompt: {
    color: '#ccc',
    fontSize: 14,
  },
  registerLink: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 14,
  },
});
