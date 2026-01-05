import { SizeSlider } from './components/size-slider.component';
import { SizeTextfield } from './components/size-textfield.component';
import * as styles from './size-input.css';

export function SizeInput() {
  return (
    <div css={styles.container}>
      <SizeTextfield />
      <SizeSlider />
    </div>
  );
}
