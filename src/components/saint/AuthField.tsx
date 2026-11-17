import { useRef, useState } from 'react';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { authHaptic } from './authHaptics';
import { FONTS, mixColors, useTheme } from './theme';

type InputInstance = ComponentRef<typeof TextInput>;

export function AuthField({
  label,
  password,
  inputRef,
  style,
  ...inputProps
}: TextInputProps & { label: string; password?: boolean; inputRef?: Ref<InputInstance> }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderColor = focused ? theme.pillInk : mixColors(theme.surface, theme.ink, 0.24);
  const placeholderTextColor = mixColors(theme.surface, theme.ink, 0.64);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.ink }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor }]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={placeholderTextColor}
          selectionColor={theme.accent}
          secureTextEntry={password && !visible}
          {...inputProps}
          onFocus={event => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[styles.input, { color: theme.ink }, style]}
        />
        {password && (
          <Pressable
            onPress={() => {
              authHaptic('select');
              setVisible(current => !current);
            }}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
            <Text style={[styles.toggleText, { color: theme.inkSoft }]}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function AuthCredentials({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  newAccount,
  busy,
}: {
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  newAccount?: boolean;
  busy: boolean;
}) {
  const passwordInput = useRef<InputInstance>(null);

  return (
    <>
      <AuthField
        label="Email address"
        value={email}
        onChangeText={onEmailChange}
        editable={!busy}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <AuthField
        label="Password"
        password
        inputRef={passwordInput}
        value={password}
        onChangeText={onPasswordChange}
        editable={!busy}
        placeholder={newAccount ? 'Choose a password' : 'Enter your password'}
        autoComplete={newAccount ? 'new-password' : 'current-password'}
        returnKeyType={newAccount ? 'go' : 'done'}
        onSubmitEditing={onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  toggle: { minHeight: 44, minWidth: 54, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  toggleText: { fontFamily: FONTS.bodySemi, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
