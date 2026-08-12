import type { ComponentProps } from "react";
import { useProfileActions } from "@/src/application/profile-store";
import { Button } from "@/src/shared/ui";
import { AlwaysEnableProfileButton } from "./AlwaysEnableProfileButton";

type AddProfileButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  activate?: boolean;
};

export function AddProfileButton({
  activate = true,
  ...props
}: AddProfileButtonProps) {
  const { addProfile, setActiveProfile } = useProfileActions();

  return (
    <Button
      {...props}
      onClick={() => {
        const id = addProfile();
        if (activate) setActiveProfile(id);
      }}
    />
  );
}

type ProfileAlwaysEnableButtonProps = Omit<
  ComponentProps<typeof AlwaysEnableProfileButton>,
  "onCheckedChange"
> & {
  profileId: string;
};

export function ProfileAlwaysEnableButton({
  profileId,
  ...props
}: ProfileAlwaysEnableButtonProps) {
  const { setProfileAlwaysEnabled } = useProfileActions();

  return (
    <AlwaysEnableProfileButton
      {...props}
      onCheckedChange={(enabled) => setProfileAlwaysEnabled(profileId, enabled)}
    />
  );
}
