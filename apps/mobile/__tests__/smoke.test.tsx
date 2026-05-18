import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

const SmokeComponent = () => (
  <View>
    <Text>Smoke Test</Text>
  </View>
);

describe('Smoke Test', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SmokeComponent />);
    expect(getByText('Smoke Test')).toBeTruthy();
  });
});
