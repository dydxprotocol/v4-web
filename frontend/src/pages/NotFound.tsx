import * as styles from './NotFound.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>404 - Not Found</h1>
      <p className={styles.text}>The page you're looking for doesn't exist.</p>
    </div>
  );
}
