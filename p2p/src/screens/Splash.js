import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';

function Splash(){
    useEffect(async () => {
        const data = await this.navigateToHome();
        if(data !== null){
            // navigate to Home screen
        }
    },[]);

    navigateToHome = async () => {
        // Splash screen will remain visible for 2 seconds
        const wait = time => new Promise((resolve) => setTimeout(resolve, time));
        return wait(2000).then(() => this.props.navigation.navigate('Home'))
    };

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 25 }}>SPLASH SCREEN</Text>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Splash;