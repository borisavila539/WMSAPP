import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { SafeAreaView } from 'react-native'
import { Navigation } from './src/navigation/navigation';
import { WMSProvider } from './src/context/WMSContext';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppState>
          <Navigation />
        </AppState>
      </NavigationContainer>
    </SafeAreaView>
  )
}

const AppState = ({ children }: any) => {
  return (
    <WMSProvider>
      {children}
    </WMSProvider>
  )
}

export default App;