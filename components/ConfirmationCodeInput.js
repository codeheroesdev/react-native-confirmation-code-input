// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet, ViewPropTypes } from 'react-native';

import _ from 'lodash';

// if ViewPropTypes is not defined fall back to View.propType (to support RN < 0.44)
const viewPropTypes = ViewPropTypes || View.propTypes;

export default class ConfirmationCodeInput extends Component {
  static propTypes = {
    codeLength: PropTypes.number,
    compareWithCode: PropTypes.string,
    inputPosition: PropTypes.string,
    size: PropTypes.number,
    space: PropTypes.number,
    className: PropTypes.string,
    cellBorderWidth: PropTypes.number,
    activeColor: PropTypes.string,
    textColor: PropTypes.string,
    errorColor: PropTypes.string,
    inactiveColor: PropTypes.string,
    ignoreCase: PropTypes.bool,
    autoFocus: PropTypes.bool,
    codeInputStyle: TextInput.propTypes.style,
    containerStyle: viewPropTypes.style,
    onFulfill: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    error: PropTypes.bool
  };

  static defaultProps = {
    codeLength: 5,
    inputPosition: 'center',
    autoFocus: true,
    size: 40,
    className: 'border-box',
    cellBorderWidth: 1,
    activeColor: 'rgba(255, 255, 255, 0.3)',
    inactiveColor: 'rgba(255, 255, 255, 0.2)',
    errorColor: 'rgba(255, 255, 255, 0.2)',
    textColor: 'rgba(0, 0, 0, 1)',
    space: 8,
    compareWithCode: '',
    ignoreCase: false,
    onChange: _.noop,
    onFocus: _.noop,
    error: false
  };

  constructor(props) {
    super(props);

    this.state = {
      codeArr: new Array(this.props.codeLength).fill(''),
      currentIndex: 0,
      focused: false
    };

    this.codeInputRefs = [];
  }

  componentDidMount() {
    const { compareWithCode, codeLength, inputPosition } = this.props;
    if (compareWithCode && compareWithCode.length !== codeLength) {
      console.error(
        'Invalid props: compareWith length is not equal to codeLength'
      );
    }

    if (
      _.indexOf(['center', 'left', 'right', 'full-width'], inputPosition) === -1
    ) {
      console.error(
        'Invalid input position. Must be in: center, left, right, full'
      );
    }
  }

  clear() {
    this.setState({
      codeArr: new Array(this.props.codeLength).fill(''),
      currentIndex: 0
    });
    this.setFocus(0);
  }

  setFocus(index) {
    this.codeInputRefs[index].focus();
  }

  _blur(index) {
    this.codeInputRefs[index].blur();
  }

  _onFocus(index) {
    let newCodeArr = _.clone(this.state.codeArr);
    const currentEmptyIndex = _.findIndex(newCodeArr, c => !c);
    if (currentEmptyIndex !== -1 && currentEmptyIndex < index) {
      return this.setFocus(currentEmptyIndex);
    }
    for (const i in newCodeArr) {
      if (i >= index) {
        newCodeArr[i] = '';
      }
    }

    this.props.onChange(newCodeArr.join(''));
    this.props.onFocus();

    this.setState({
      codeArr: newCodeArr,
      currentIndex: index,
      focused: true
    });
  }

  _isMatchingCode(code, compareWithCode, ignoreCase = false) {
    if (ignoreCase) {
      return code.toLowerCase() === compareWithCode.toLowerCase();
    }
    return code === compareWithCode;
  }

  _getContainerStyle(size, position) {
    return {
      justifyContent: 'center',
      height: size
    };
  }

  _getInputSpaceStyle(space) {
    return {
      marginRight: space / 2,
      marginLeft: space / 2
    };
  }

  _getBorderColor(active, error) {
    if (error) return this.props.errorColor;
    return active ? this.props.activeColor : this.props.inactiveColor;
  }

  _getClassStyle(className, active, error) {
    const { cellBorderWidth, errorColor, space, textColor } = this.props;

    let classStyle = {
      ...this._getInputSpaceStyle(space),
      color: error ? errorColor : textColor
    };

    return _.merge(classStyle, {
      borderWidth: cellBorderWidth,
      borderColor: this._getBorderColor(active, error)
    });
  }

  _onKeyPress(e) {
    if (e.nativeEvent.key === 'Backspace') {
      // Return if duration between previous key press and backspace is less than 20ms
      if (Math.abs(this.lastKeyEventTimestamp - e.timeStamp) < 20) return;

      const { currentIndex, codeArr } = this.state;
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;

      this.setState(
        {
          codeArr: [
            ...codeArr.slice(0, nextIndex),
            '',
            ...codeArr.slice(nextIndex + 1)
          ]
        },
        () => this.props.onChange(this.state.codeArr.join(''))
      );

      this.setFocus(nextIndex);
    } else {
      // Record non-backspace key event time stamp
      this.lastKeyEventTimestamp = e.timeStamp;
    }
  }

  _onInputCode(character, index, onChange) {
    const { codeLength, onFulfill, compareWithCode, ignoreCase } = this.props;
    let newCodeArr = _.clone(this.state.codeArr);
    newCodeArr[index] = character;

    if (index === codeLength - 1) {
      const code = newCodeArr.join('');

      if (compareWithCode) {
        const isMatching = this._isMatchingCode(
          code,
          compareWithCode,
          ignoreCase
        );
        onFulfill(isMatching, code);
      } else {
        onFulfill(code);
      }
      this._blur(this.state.currentIndex);
    } else {
      this.setFocus(this.state.currentIndex + 1);
    }

    this.props.onChange(newCodeArr.join(''));

    this.setState(prevState => {
      return {
        codeArr: newCodeArr,
        currentIndex: prevState.currentIndex + 1
      };
    });
  }

  render() {
    const {
      codeLength,
      codeInputStyle,
      containerStyle,
      inputPosition,
      autoFocus,
      className,
      size,
      activeColor
    } = this.props;

    const initialCodeInputStyle = {
      width: size,
      height: size
    };

    let codeInputs = [];
    for (let i = 0; i < codeLength; i++) {
      const id = i;
      codeInputs.push(
        <TextInput
          key={id}
          ref={ref => (this.codeInputRefs[id] = ref)}
          style={[
            styles.codeInput,
            initialCodeInputStyle,
            this._getClassStyle(
              className,
              this.state.currentIndex === id && this.state.focused,
              this.props.error
            ),
            codeInputStyle
          ]}
          underlineColorAndroid="transparent"
          selectionColor={activeColor}
          keyboardType={'name-phone-pad'}
          returnKeyType={'done'}
          {...this.props}
          autoFocus={autoFocus && id === 0}
          onFocus={() => this._onFocus(id)}
          onBlur={() => this.setState({ focused: false })}
          value={
            this.state.codeArr[id] ? this.state.codeArr[id].toString() : ''
          }
          onChangeText={text => this._onInputCode(text, id)}
          onKeyPress={e => this._onKeyPress(e)}
          maxLength={1}
        />
      );
    }

    return (
      <View
        style={[
          styles.container,
          this._getContainerStyle(size, inputPosition),
          containerStyle
        ]}
      >
        {codeInputs}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 20
  },
  codeInput: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    padding: 0
  }
});
