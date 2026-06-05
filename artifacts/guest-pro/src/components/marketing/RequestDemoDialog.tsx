import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { marketingContactUrl } from "@/lib/marketing-routes";

interface RequestDemoDialogProps {
  trigger: ReactNode;
}

/**
 * Routes "Request demo" CTAs to the public contact page (Colega form).
 */
export function RequestDemoDialog({ trigger }: RequestDemoDialogProps) {
  const navigateToContact = () => {
    window.location.assign(marketingContactUrl());
  };

  if (!isValidElement(trigger)) {
    return (
      <button type="button" onClick={navigateToContact}>
        {trigger}
      </button>
    );
  }

  const element = trigger as ReactElement<{ onClick?: React.MouseEventHandler }>;
  return cloneElement(element, {
    onClick: (event: React.MouseEvent) => {
      element.props.onClick?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      navigateToContact();
    },
  });
}
