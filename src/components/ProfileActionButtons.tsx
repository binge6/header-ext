import type { ComponentProps } from "react";
import { AlwaysEnableProfileButton } from "./AlwaysEnableProfileButton";
import { Button } from "@/src/ui";
import { useProfileActions } from "@/src/store/profileStore";

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
