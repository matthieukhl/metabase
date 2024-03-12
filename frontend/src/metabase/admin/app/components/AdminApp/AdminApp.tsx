import type { ReactNode } from "react";

import { useSelector } from "metabase/lib/redux";
import { getLocaleWritingDirection } from "metabase/selectors/app";

import DeprecationNotice from "../../containers/DeprecationNotice";

export interface AdminAppProps {
  children?: ReactNode;
}

const AdminApp = ({ children }: AdminAppProps): JSX.Element => {
  const writingDirection = useSelector(getLocaleWritingDirection);
  return (
    <div dir={writingDirection}>
      <DeprecationNotice />
      {children}
    </div>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default AdminApp;
