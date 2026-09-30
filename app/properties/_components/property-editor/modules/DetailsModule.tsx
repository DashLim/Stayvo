import { Loader2, Sparkles } from 'lucide-react';
import { capitalizeWordStarts } from '@/lib/capitalize-word-starts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { FieldGroup } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

type DetailsModuleProps = Pick<
  PropertyFormModuleSharedProps,
  | 'mode'
  | 'locations'
  | 'isLive'
  | 'setIsLive'
  | 'locationId'
  | 'setLocationId'
  | 'locationName'
  | 'setLocationName'
  | 'propertyName'
  | 'setPropertyName'
  | 'internalName'
  | 'setInternalName'
  | 'fullAddress'
  | 'setFullAddress'
  | 'googleMapsUrl'
  | 'setGoogleMapsUrl'
  | 'wazeUrl'
  | 'setWazeUrl'
  | 'parkingDetails'
  | 'setParkingDetails'
  | 'wifiNetworkName'
  | 'setWifiNetworkName'
  | 'wifiPassword'
  | 'setWifiPassword'
  | 'airbnbImportUrl'
  | 'setAirbnbImportUrl'
  | 'airbnbImporting'
  | 'airbnbImportError'
  | 'airbnbImportNotes'
  | 'airbnbImportSummary'
  | 'onImportAirbnb'
>;

export default function DetailsModule(props: DetailsModuleProps) {
  const {
    mode,
    locations,
    isLive,
    setIsLive,
    locationId,
    setLocationId,
    locationName,
    setLocationName,
    propertyName,
    setPropertyName,
    internalName,
    setInternalName,
    fullAddress,
    setFullAddress,
    googleMapsUrl,
    setGoogleMapsUrl,
    wazeUrl,
    setWazeUrl,
    parkingDetails,
    setParkingDetails,
    wifiNetworkName,
    setWifiNetworkName,
    wifiPassword,
    setWifiPassword,
    airbnbImportUrl,
    setAirbnbImportUrl,
    airbnbImporting,
    airbnbImportError,
    airbnbImportNotes,
    airbnbImportSummary,
    onImportAirbnb,
  } = props;

  return (
    <PropertyEditorPanel
      title="Property details"
      description="What guests need before arrival."
    >
      {mode === 'create' ? (
        <div className="rounded-lg border border-primary/25 bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Import from Airbnb</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Paste your Airbnb listing URL — we&apos;ll auto-fill property name, host, address,
                house rules and more. Review before saving.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              type="url"
              value={airbnbImportUrl}
              onChange={(e) => {
                setAirbnbImportUrl(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void onImportAirbnb();
                }
              }}
              placeholder="https://www.airbnb.com/rooms/12345678"
              inputMode="url"
              autoComplete="off"
              disabled={airbnbImporting}
            />
            <Button
              type="button"
              disabled={airbnbImporting || !airbnbImportUrl.trim()}
              onClick={() => void onImportAirbnb()}
              className="shrink-0"
            >
              {airbnbImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Importing…
                </>
              ) : (
                'Import'
              )}
            </Button>
          </div>
          {airbnbImportError ? (
            <p className="mt-3 text-sm text-destructive">{airbnbImportError}</p>
          ) : null}
          {airbnbImportSummary ? (
            <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm">
              <p className="font-medium text-foreground">Import complete</p>
              <p className="mt-1 text-muted-foreground">{airbnbImportSummary}</p>
              {airbnbImportNotes.filter((n) => !n.toLowerCase().startsWith('review')).length >
              0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {airbnbImportNotes
                    .filter((n) => !n.toLowerCase().startsWith('review'))
                    .map((note, idx) => (
                      <li key={idx}>· {note}</li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
        <span className="text-sm font-medium text-foreground">Status</span>
        <label className="inline-flex items-center gap-3 text-sm font-medium">
          {isLive ? 'Live' : 'Draft'}
          <input
            type="checkbox"
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
        <FieldGroup
          label="Location group"
          hint="Which city or area this property belongs to on your dashboard."
          className="sm:col-span-2"
        >
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {locations.length === 0 ? (
              <option value="">Create a location from Property management first</option>
            ) : (
              locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))
            )}
          </select>
        </FieldGroup>
        <FieldGroup
          label="Location name"
          hint="Shown on your dashboard (e.g. Aspen, Colorado)."
          className="sm:col-span-2"
        >
          <Input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={!locationId}
            placeholder="e.g. Miami, Florida"
          />
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Property name"
          hint="Guest will see this. Line breaks are kept on the guest page."
          className="sm:col-span-2"
        >
          <Textarea
            required
            rows={3}
            autoCapitalize="words"
            value={propertyName}
            onChange={(e) => setPropertyName(capitalizeWordStarts(e.target.value))}
            placeholder="Property name"
            className="min-h-[4.5rem]"
          />
        </FieldGroup>
        <FieldGroup
          label="Internal name"
          hint="For internal record only."
          className="sm:col-span-2"
        >
          <Input
            type="text"
            autoCapitalize="words"
            value={internalName}
            onChange={(e) => setInternalName(capitalizeWordStarts(e.target.value))}
          />
        </FieldGroup>
        <FieldGroup label="Full address" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            className="resize-none"
          />
        </FieldGroup>
        <FieldGroup label="Google Maps URL">
          <Input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Waze URL">
          <Input value={wazeUrl} onChange={(e) => setWazeUrl(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Parking details" className="sm:col-span-2">
          <Textarea
            rows={4}
            value={parkingDetails}
            onChange={(e) => setParkingDetails(e.target.value)}
            className="min-h-[5rem]"
          />
        </FieldGroup>
        <FieldGroup label="Wifi network name">
          <Input
            name="stayvo_wifi_ssid"
            value={wifiNetworkName}
            onChange={(e) => setWifiNetworkName(e.target.value)}
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="Wifi password">
          <Input
            name="stayvo_wifi_passphrase"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </FieldGroup>
      </div>
    </PropertyEditorPanel>
  );
}
