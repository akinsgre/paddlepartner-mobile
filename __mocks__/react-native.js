// Mock for React Native
const React = require('react');

const StyleSheet = {
  create: (styles) => styles,
  flatten: (styles) => styles,
  compose: (style1, style2) => [style1, style2],
  hairlineWidth: 1,
  absoluteFill: 0,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Create mock components that behave like React components
const createMockComponent = (name) => {
  const Component = React.forwardRef((props, ref) =>
    React.createElement(name, { ...props, ref }, props.children)
  );
  Component.displayName = name;
  return Component;
};

const View = createMockComponent('View');
const Text = createMockComponent('Text');
const TextInput = createMockComponent('TextInput');
const TouchableOpacity = createMockComponent('TouchableOpacity');
const ScrollView = createMockComponent('ScrollView');
const Image = createMockComponent('Image');
const ActivityIndicator = createMockComponent('ActivityIndicator');
const Button = createMockComponent('Button');

const Alert = {
  alert: jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 0) {
      // Automatically call the first button's onPress (usually the positive action)
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  }),
};

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

module.exports = {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Button,
  Platform,
};
