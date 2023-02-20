import AsyncStorage from "@react-native-async-storage/async-storage";

const isFirstLaunch = async (): Promise<boolean> => {
  const HAS_LAUNCHED: string = "hasLaunched";
  try {
    const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED);
    if (hasLaunched === null) {
      AsyncStorage.setItem(HAS_LAUNCHED, "true");
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export default isFirstLaunch;
