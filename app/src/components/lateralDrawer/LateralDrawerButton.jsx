import { Button } from '@heroui/react';

/**
 * Button for the lateral drawer: icon on the left, then the text, aligned to
 * the left and as wide as the drawer.
 *
 * @param {object} props
 * @param {string} props.text label shown next to the icon
 * @param {import('react').ReactNode} props.icon icon element, e.g. <LogoutIcon />
 * @param {() => void} props.onPress
 * @param {boolean} [props.isPending] shows the spinner and `pendingText`
 * @param {string} [props.pendingText] label while pending (defaults to `text`)
 */
export default function LateralDrawerButton({
  text,
  icon,
  onPress,
  isPending = false,
  pendingText,
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      fullWidth
      className="justify-start"
      style={{ gap: 20 }}
      isPending={isPending}
      onPress={onPress}
    >
      {!isPending && icon}
      {isPending ? pendingText ?? text : text}
    </Button>
  );
}
