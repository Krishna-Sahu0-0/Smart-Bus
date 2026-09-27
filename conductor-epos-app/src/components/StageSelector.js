import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/constants';

export default function StageSelector({ label, stages, selectedId, onSelect, disabledStageId }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {stages.map((stage) => {
          const disabled = stage.stageId === disabledStageId;
          const selected = stage.stageId === selectedId;
          return <Pressable key={stage.stageId} disabled={disabled} onPress={() => onSelect(stage)} style={[styles.option, selected && styles.selected, disabled && styles.disabled]}><Text style={[styles.name, selected && styles.selectedText]}>{stage.stageName}</Text><Text style={[styles.sequence, selected && styles.selectedText]}>STAGE {stage.sequence}</Text></Pressable>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  options: { gap: 8 },
  option: { minHeight: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.panel, paddingHorizontal: 14, justifyContent: 'center' },
  selected: { borderColor: colors.amber, backgroundColor: '#3A3322' },
  disabled: { opacity: 0.35 },
  name: { color: colors.white, fontSize: 16, fontWeight: '800' },
  sequence: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  selectedText: { color: colors.amber },
});