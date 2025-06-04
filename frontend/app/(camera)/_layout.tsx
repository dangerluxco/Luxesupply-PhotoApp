import { Stack } from 'expo-router';

export default function CameraLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Product Photography',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 