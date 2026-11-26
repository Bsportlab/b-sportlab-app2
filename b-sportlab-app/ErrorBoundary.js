import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';

const LIME_ACCENT = '#A3E635';
const LIME_DARK = '#4D7C0F';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Errore imprevisto' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>B-sportlab</Text>
            <Text style={styles.title}>Si è verificato un errore imprevisto</Text>
            <Text style={styles.desc}>
              I tuoi dati e il piano alimentare sono al sicuro. Tocca il pulsante qui sotto per ricaricare l’applicazione.
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={this.handleReload}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>🔄 Ricarica App</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#27272A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: LIME_ACCENT,
    borderWidth: 1.5,
    borderColor: LIME_DARK,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: '#050505',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
