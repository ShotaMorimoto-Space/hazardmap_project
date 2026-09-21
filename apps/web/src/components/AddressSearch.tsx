"use client";

import styles from "./MapCreator.module.css";

type AddressSearchProps = {
  addressInput: string;
  currentAddress: string;
  loading: boolean;
  error: string | null;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
};

export default function AddressSearch({
  addressInput,
  currentAddress,
  loading,
  error,
  onAddressChange,
  onSubmit,
}: AddressSearchProps) {
  return (
    <div className={styles.addressBlock}>
      <form
        className={styles.addressForm}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          className={styles.addressInput}
          type="text"
          name="address"
          autoComplete="street-address"
          placeholder="住所を入力"
          value={addressInput}
          disabled={loading}
          onChange={(event) => onAddressChange(event.target.value)}
        />
        <button className={styles.addressButton} type="submit" disabled={loading}>
          {loading ? "検索中…" : "この住所でマップを表示"}
        </button>
      </form>

      <p className={styles.currentAddress}>
        現在地:
        <br />
        {currentAddress}
      </p>

      {error ? <p className={styles.geocodeError}>{error}</p> : null}

      <p className={styles.areaNote}>現在のValidation対象エリア：兵庫県</p>
    </div>
  );
}
