import Spinner from "./Spinner.jsx";

export default function FullPageSpinner({ label = "Carregando..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-teal-700">
      <Spinner className="size-8" label={label} />
    </div>
  );
}
