import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.number}>
            {countdown.days.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.label}>D</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.number}>
            {countdown.hours.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.label}>H</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.number}>
            {countdown.minutes.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.label}>MIN</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.number}>
            {countdown.seconds.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.label}>SEC</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  number: {
    fontWeight: 'bold',
    color: '#014fa1',
    fontSize: 18,
  },
  label: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
  },
});

export default CountdownTimer;
