import React, { useState, useImperativeHandle, forwardRef, RefObject } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react-native';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export interface CustomAlertRef {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

export const customAlertRef: RefObject<CustomAlertRef> = React.createRef<CustomAlertRef>();

// Use this Alert object to replace react-native's Alert
export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (customAlertRef.current) {
      customAlertRef.current.alert(title, message, buttons);
    } else {
      import('react-native').then(rn => rn.Alert.alert(title, message, buttons));
    }
  }
};

export const CustomAlertModal = forwardRef<CustomAlertRef>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    alert: (t: string, m?: string, b?: AlertButton[]) => {
      setTitle(t);
      setMessage(m || '');
      setButtons(b && b.length > 0 ? b : [{ text: 'OK' }]);
      setVisible(true);
      
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 12,
          speed: 14,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }));

  const close = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
      if (callback) callback();
    });
  };

  if (!visible) return null;

  const isError = title.toLowerCase().includes('erreur') || title.toLowerCase().includes('échec');
  const isSuccess = title.toLowerCase().includes('succès');
  const Icon = isError ? AlertTriangle : isSuccess ? CheckCircle : Info;
  const iconColor = isError ? '#ef4444' : isSuccess ? '#22c55e' : '#6366f1';
  const iconBg = isError ? 'bg-red-100' : isSuccess ? 'bg-green-100' : 'bg-indigo-100';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => close()}>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <TouchableWithoutFeedback onPress={() => close()}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>
        <Animated.View 
          className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl items-center"
          style={{ 
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          }}
        >
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${iconBg}`}>
             <Icon color={iconColor} size={32} />
          </View>
          
          <Text className="text-2xl font-bold text-slate-800 text-center mb-2">{title}</Text>
          {!!message && <Text className="text-base text-slate-500 text-center mb-6 leading-6">{message}</Text>}
          
          <View className={`flex-row justify-center w-full ${buttons.length > 2 ? 'flex-col space-y-3' : 'space-x-3'}`}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                className={`flex-1 rounded-xl py-3.5 px-4 items-center justify-center ${
                  btn.style === 'destructive' 
                    ? 'bg-red-500' 
                    : btn.style === 'cancel' 
                      ? 'bg-slate-100' 
                      : 'bg-indigo-600'
                } ${buttons.length > 2 ? 'w-full' : ''}`}
                onPress={() => {
                  close(btn.onPress);
                }}
              >
                <Text className={`font-semibold text-lg ${
                  btn.style === 'cancel' ? 'text-slate-700' : 'text-white'
                }`}>
                  {btn.text || 'OK'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});
