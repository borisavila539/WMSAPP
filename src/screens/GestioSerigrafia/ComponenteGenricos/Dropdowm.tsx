import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  UIManager,
  findNodeHandle,
  Dimensions,
} from "react-native";

interface DropdownProps {
  options: string[];               // Lista de elementos dinámicos
  selectedOption?: string;         // Opción seleccionada por defecto
  onSelect: (value: string) => void;
  placeholder?: string;            // Texto cuando no hay selección
  includeAll?: boolean;            // <-- Nueva prop para incluir "All"
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedOption,
  onSelect,
  placeholder = "",
  includeAll = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(selectedOption || "");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);

  // Generar las opciones de menú (con o sin "All")
  const [menuOptions, setMenuOptions] = useState<string[]>([]);

  useEffect(() => {
    const uniqueOptions = Array.from(new Set(options));
    if (includeAll) {
      setMenuOptions(["All", ...uniqueOptions.filter(o => o !== "All")]);
    } else {
      setMenuOptions(uniqueOptions);
    }
  }, [options, includeAll]);

  const openDropdown = () => {
    const nodeHandle = findNodeHandle(buttonRef.current);
    if (nodeHandle) {
      UIManager.measure(
        nodeHandle,
        (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setDropdownPosition({ top: pageY + height, left: pageX, width });
          setIsOpen(true);
        }
      );
    }
  };

  const handleSelect = (value: string) => {
    setSelected(value);
    setIsOpen(false);
    onSelect(value);
  };

  return (
    <View>
      <TouchableOpacity ref={buttonRef} style={styles.dropdown} onPress={openDropdown}>
        <Text style={styles.dropdownText}>
          {selected !== "" ? selected : placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="none">
        <TouchableOpacity style={styles.backdrop} onPress={() => setIsOpen(false)} />

        <View
          style={[
            styles.dropdownMenu,
            {
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            },
          ]}
        >
          <FlatList
            data={menuOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 14, color: "#374151" },
  dropdownArrow: { fontSize: 12, color: "#6b7280" },
  backdrop: { flex: 1, backgroundColor: "transparent" },
  dropdownMenu: {
    position: "absolute",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    maxHeight: Dimensions.get("window").height / 3,
    zIndex: 9999,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, color: "#374151" },
});

export default Dropdown;
