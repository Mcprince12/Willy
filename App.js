import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import {createAppContainer} from 'react-navigation'
import {createBottomTabNavigator} from 'react-navigation-tabs'
import SearchScreen from './screens/SearchScreen'
import BookTransactionScreen from './screens/BookTransactionScreen'
import {createSwitchNavigator} from 'react-navigation';
import LoginScreen from './/screens/LoginScreen'

export default class App extends React.Component {
  render(){
  return (
    <View style={styles.container}>
      <AppContainer/>
    </View>
  );
  }
}


const TabNavigator=createBottomTabNavigator({
  Transaction:{screen:BookTransactionScreen},
  Search:{screen:SearchScreen},
},
  {
    defaultNavigationOptions:({navigation})=>({
      tabBarIcon:()=>{
        const routeName = navigation.state.routeName
        if(routeName==='Transaction'){
          return(<Image source={require('./assets/book.png')} 
          style={{width:40, height:40}}/>)
        } else if(routeName==="Search"){
          return(<Image source={require('./assets/searchingbook.png')}
          style={{width:40, height:40}}/>)
        } 
      }
    })
  }
)

const switchNavigator = createSwitchNavigator({
  LoginScreen:{screen:LoginScreen},
  TabNavigator:{screen:TabNavigator}
})
const AppContainer = createAppContainer(switchNavigator);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'aqua',
    alignItems:'center',
    justifyContent:'center',
  },
});