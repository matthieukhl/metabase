import { useState, useEffect } from "react";
import { t } from "ttag";

import LogoIcon from "metabase/components/LogoIcon";
import { useSelector } from "metabase/lib/redux";
import { getLocaleWritingDirection } from "metabase/selectors/app";
import { getIsPaidPlan } from "metabase/selectors/settings";
import { Button, Icon } from "metabase/ui";
import type { User } from "metabase-types/api";
import type { AdminPath } from "metabase-types/store";

import StoreLink from "../StoreLink";

import { AdminNavItem } from "./AdminNavItem";
import {
  AdminExitLink,
  AdminLogoContainer,
  AdminLogoLink,
  AdminLogoText,
  AdminNavbarItems,
  AdminNavbarRoot,
  AdminMobileNavbar,
  AdminMobileNavBarItems,
  MobileHide,
} from "./AdminNavbar.styled";

interface AdminNavbarProps {
  path: string;
  user: User;
  adminPaths: AdminPath[];
}

export const AdminNavbar = ({
  path: currentPath,
  adminPaths,
}: AdminNavbarProps) => {
  const isPaidPlan = useSelector(getIsPaidPlan);
  const writingDirection = useSelector(getLocaleWritingDirection);

  return (
    <AdminNavbarRoot
      dir={writingDirection}
      data-element-id="navbar-root"
      aria-label={t`Navigation bar`}
    >
      <AdminLogoLink to="/admin">
        <AdminLogoContainer>
          <LogoIcon className="text-brand my2" dark />
          {/* eslint-disable-next-line no-literal-metabase-strings -- Metabase settings */}
          <AdminLogoText>{t`Metabase Admin`}</AdminLogoText>
        </AdminLogoContainer>
      </AdminLogoLink>

      <MobileNavbar adminPaths={adminPaths} currentPath={currentPath} />

      <MobileHide>
        <AdminNavbarItems>
          {adminPaths.map(({ name, key, path }) => (
            <AdminNavItem
              name={name}
              path={path}
              key={key}
              currentPath={currentPath}
            />
          ))}
        </AdminNavbarItems>

        {!isPaidPlan && <StoreLink />}
        <AdminExitLink
          to="/"
          data-testid="exit-admin"
        >{t`Exit admin`}</AdminExitLink>
      </MobileHide>
    </AdminNavbarRoot>
  );
};

interface AdminMobileNavbarProps {
  adminPaths: AdminPath[];
  currentPath: string;
}

const MobileNavbar = ({ adminPaths, currentPath }: AdminMobileNavbarProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      const listener = () => setMobileNavOpen(false);
      document.addEventListener("click", listener, { once: true });
      return () => document.removeEventListener("click", listener);
    }
  }, [mobileNavOpen]);

  return (
    <AdminMobileNavbar>
      <Button
        onClick={() => setMobileNavOpen(prev => !prev)}
        variant="subtle"
        p="0.25rem"
      >
        <Icon name="burger" size={32} color="white" />
      </Button>
      {mobileNavOpen && (
        <AdminMobileNavBarItems>
          {adminPaths.map(({ name, key, path }) => (
            <AdminNavItem
              name={name}
              path={path}
              key={key}
              currentPath={currentPath}
            />
          ))}
          <AdminExitLink to="/">{t`Exit admin`}</AdminExitLink>
        </AdminMobileNavBarItems>
      )}
    </AdminMobileNavbar>
  );
};
