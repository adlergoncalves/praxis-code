type BarraFerramentasProps = {
  aoExcluir: () => void;
};

export function BarraFerramentas({ aoExcluir }: BarraFerramentasProps): JSX.Element {
  return (
    <div role="toolbar" aria-label="Acoes do documento">
      <button type="button" onClick={aoExcluir}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 4h10M6 4V2h4v2M5 4l1 10h4l1-10" />
        </svg>
      </button>
    </div>
  );
}
