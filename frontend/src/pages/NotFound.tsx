import { Link } from 'react-router';
import * as styles from './NotFound.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.ghost}>👻</div>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.text}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className={styles.homeLink}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
