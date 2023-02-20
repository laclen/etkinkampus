import WebView from "react-native-webview";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import BackButton from "./components/backButton";
import isFirstLaunch from "./utils/detectFirstLaunch";
import { getStatusBarHeight } from "react-native-safearea-height";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { WebViewNavigation, WebViewScrollEvent } from "react-native-webview/lib/WebViewTypes";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { StyleSheet, View, Platform, Alert, Linking, RefreshControl, ScrollView, BackHandler, ActivityIndicator, Dimensions } from "react-native";

const PLATFORM = Platform.OS;
const { height, width } = Dimensions.get("window");

export default function App() {
  const webViewRef = useRef<WebView>();

  const [showBackButton, setShowBackButton] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);

  // opens app settings
  const getSettings = () => Linking.openSettings();

  // back to previous webview page
  const onBackPress = (): boolean => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    } else {
      return false;
    }
  };

  // manage back button availability, display it when not in login or main page
  const checkBackButtonAvailability = (navState: WebViewNavigation): Boolean => navState && navState.canGoBack && navState.url !== "https://akademi.etkinkampus.com/login";

  // onNavigationStateChange, manage backbutton availability, and
  // set statusbar to light text everytime state changes
  // because it's bugged in ios
  const handleNavigatioStateChange = (navState: WebViewNavigation): void => {
    setStatusBarStyle("light");
    checkBackButtonAvailability(navState) ? setShowBackButton(true) : setShowBackButton(false);
  };

  // scroll handler to manually enable PullToRefresh property for android
  const handleScroll = (e: WebViewScrollEvent): void => (Number(e.nativeEvent.contentOffset.y) === 0 ? setEnableRefresher(true) : setEnableRefresher(false));

  // get camera and photo library permissions for users' profile picture preferences
  useEffect(() => {
    const getPermissions = async () => {
      const firstLaunch: Boolean = await isFirstLaunch();
      await check(PLATFORM === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
        if (result !== RESULTS.GRANTED && result !== RESULTS.UNAVAILABLE) {
          request(PLATFORM === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((response) => {
            if (response === RESULTS.DENIED && firstLaunch) {
              Alert.alert("Dikkat!", "Profil fotoğrafı çekebilmek için uygulama ayarlarından kamera erişimine izin vermeyi unutmayın.", [
                {
                  text: "İptal",
                  style: "cancel",
                },
                { text: "Ayarlara Git", onPress: () => getSettings() },
              ]);
            }
          });
        }
      });
      await check(PLATFORM === "ios" ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((result) => {
        if (result !== RESULTS.GRANTED && result !== RESULTS.UNAVAILABLE) {
          request(PLATFORM === "ios" ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES).then((response) => {
            if (response === RESULTS.DENIED && firstLaunch) {
              Alert.alert("Dikkat!", "Galeriden profil fotoğrafı seçebilmek için uygulama ayarlarından izinleri düzenlemeyi unutmayın.", [
                {
                  text: "İptal",
                  style: "cancel",
                },
                { text: "Ayarlara Git", onPress: () => getSettings() },
              ]);
            }
          });
        }
      });
    };

    getPermissions();
  }, []);

  // enable android hardwareBackPress for webview pages, depending on custom back button's state
  useLayoutEffect(() => {
    if (PLATFORM === "android" && showBackButton) {
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }
  }, [showBackButton]);

  return (
    <View style={styles.container}>
      {PLATFORM === "ios" ? (
        <WebView
          pullToRefreshEnabled
          source={{ uri: "https://akademi.etkinkampus.com/login" }}
          ref={webViewRef}
          onNavigationStateChange={(navState) => handleNavigatioStateChange(navState)}
          allowsBackForwardNavigationGestures // only works with iOS
          allowsInlineMediaPlayback
          javaScriptEnabled
          javaScriptCanOpenWindowsAutomatically
          renderLoading={() => (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator style={styles.webviewLoading} size="large" color="#FF7300" />
            </View>
          )}
          startInLoadingState
          style={styles.webview}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              tintColor="#FF7300"
              colors={["white"]}
              progressBackgroundColor="#FF7300"
              refreshing={false}
              enabled={refresherEnabled}
              onRefresh={() => {
                webViewRef.current.reload();
              }}
            />
          }
        >
          <StatusBar style="light" backgroundColor="#FF7300" />
          <WebView
            source={{ uri: "https://akademi.etkinkampus.com/login" }}
            ref={webViewRef}
            style={styles.webview}
            onNavigationStateChange={(navState) => handleNavigatioStateChange(navState)}
            allowsBackForwardNavigationGestures // only works with iOS
            allowsInlineMediaPlayback
            javaScriptEnabled
            javaScriptCanOpenWindowsAutomatically
            onScroll={handleScroll}
            renderLoading={() => (
              <View style={styles.webViewLoadingContainer}>
                <ActivityIndicator style={styles.webviewLoading} size="large" color="#ffffff" />
              </View>
            )}
            startInLoadingState
          />
        </ScrollView>
      )}
      {showBackButton && (
        <View style={styles.buttonWrapper}>
          <BackButton onPress={onBackPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  webview: {
    flex: 1,
    zIndex: 1,
    marginTop: getStatusBarHeight(),
    backgroundColor: "white",
  },
  webViewLoadingContainer: {
    zIndex: 3,
    width: width,
    height: height,

    justifyContent: "center",

    backgroundColor: "#FF7300",
  },
  webviewLoading: {
    zIndex: 4,
    position: "absolute",
    alignSelf: "center",
  },
  buttonWrapper: {
    zIndex: 2,
    position: "absolute",
    bottom: 50,
    left: 20,

    borderRadius: 20,
    shadowColor: "#FFC200",

    // ios shadow
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,

    // android shadow
    elevation: 15,
  },
});
