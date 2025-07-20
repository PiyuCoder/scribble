import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";

const avatarMap: Record<string, string> = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
};

const Avatar = ({
  avatarSrc,
  size,
}: {
  avatarSrc: string | undefined;
  size: string;
}) => {
  if (!avatarSrc) return null;

  const src = avatarMap[avatarSrc];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={avatarSrc}
      className={`${size} rounded-full object-cover`}
    />
  );
};

export default Avatar;
