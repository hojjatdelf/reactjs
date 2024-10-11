import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentAndSelectedRowsNode, getCurrentRowData } from "components/Hybrids/Grid/ExternalApis/Row/index";
import NoChargeDays from "views/OrderProcessing/Order/RentalOrder/NoChargeDays";
import DragAndDropGridContainer from "components/Hybrids/TruckEquipmentDragAndDrop/DragAndDropGridContainer";
import { getServerFormateDate } from "utilities/constants/datePicker/dateUtils";
import { useDispatch } from "react-redux";
import { change, getFormInitialValues, getFormValues, reset, submit } from "redux-form";
import { getRequestToServer, postRequestToServer, putRequestToServer } from "utilities/appManager";
import {
  GET_ALL_NO_CHARGE_DAYS,
  GET_ORDER_HEADER,
  RENTAL_ENTRY_PICK_RENTAL,
  RENTAL_ORDER_RECALCULATE,
  RENTAL_ORDER_UPDATE_ORDER,
  SUBRENTAL_UPDATE_ITEMS,
  UPDATE_NO_CHARGE_DAYS,
} from "utilities/constants/api";
import {
  ACCESSORY_PICK_LIST_COLUMN_STATE_NAME,
  RENTAL_ENTRY_PICK_COLUMN_STATE_NAME,
  RENTAL_ITEMS_COLUMN_STATE_NAME,
  RENTAL_ORDER_MISC_COLUMN_STATE_NAME,
  SUBRENTAL_PICK_LIST_COLUMN_STATE_NAME,
  SUBRENTAL_RECORDS_COLUMN_STATE_NAME,
} from "utilities/constants/ColumnStateNames/index";
import { RENTAL_WITH_KIT_AND_TRUCK } from "utilities/constants/componentProps/dragAndDrop";
import { getRef } from "utilities/helpers/ref";
import DialogManager from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/Dialogs/index";
import RentalMiscGridContainer from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/RentalMiscGrid/RentalMiscGridContainer";
import RentalOrderRightSide, {
  INFORMATION_BARCODE_FOCUS,
  RentalOrderRightSideFormName,
} from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/RentalOrderRightSide/index";
import {
  CHANGE_PRICE_LIST_DIALOG,
  DEFAULT_AVAILABILITY_CHECKBOX,
  dragAndDropTreeDataModel,
  getRentalOrderUrlParams,
  INLINE_GENERAL_ERROR_MESSAGE,
  RENTAL_ORDER_SIDE_BAR_PAGE_TITLE,
} from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/Utils/index";
import RentalItemsGridContainer from "./RentalItemsGrid/RentalItemsGridContainer";
import { RENTAL_ORDER_MODE, toolsItemList } from "./rentalOrderProps";
import InformationBox from "components/Hybrids/InformationBox";
import "setimmediate";
import MainSplitter from "components/Infrastructures/MainSplitter/index";
import PageTitle from "components/Hybrids/GridSectionContainers/Components/PageTitle/index";
import { LARGE_SIZE } from "components/Infrastructures/Icons/Utilities/iconSize";
import { getLocalStorageSettings, getPageSetting, updatePageSetting } from "utilities/helpers/workStationHelper";
import useAppSelector from "hooks/useAppSelector/index";
import ToolsBox from "components/Hybrids/ToolsBox/index";
import { useLocation } from "react-router-dom";
import WrapperRightSide from "components/Infrastructures/wrapperRightSide/index";
import useIsMobile from "hooks/useIsMobile";
import ExportCSV from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/Dialogs/ExportCSV/index";
import { onRefreshGrid, refreshWithAutoBookmark } from "components/Hybrids/ToolsBox/helpers";
import Modal from "components/Hybrids/Modal/index";
import RentalEntryPick from "views/OrderProcessing/Order/RentalOrder/RentalEntryPick/RentalEntryPick";
import { useRelatedSymbolFromCurrency } from "utilities/helpers/getSymbol";
import SubrentalPickList from "views/OrderProcessing/RentalOrderScreen/Subrental/SubrentalPickList/index";
import { getGridContext } from "components/Hybrids/Grid/Utils/index";
import AccessoryPickList from "views/OrderProcessing/Order/RentalOrder/AccessoryPickList/index";
import UpdateSubrentalItemsDialog from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/Dialogs/UpdateSubrentalItems/index";
import RouterPrompt from "components/Hybrids/RouterPrompt/index";
import { useBeforeUnload } from "hooks/useBeforeUnload";
import { fetchApiSendRequest } from "utilities/fetchApiManager";
import { RENTAL_ORDER_RIGHT_SIDE_FORM_NAME } from "utilities/constants/ColumnStateNames/index";
import SubrentalRecords from "views/OrderProcessing/Order/RentalOrder/SubrentalRecords/SubrentalRecords";
import {
  checkWarnCreditLimit,
  checkWarnSubrentalLimit,
  closeRentalOrder,
  openRentalOrder,
} from "views/Administration/SecuritySetup/SystemSetup/utilities/handleWarnings";
import useRevision from "hooks/useRevision/index";
import SupervisionRequest from "components/Hybrids/SupervisionRequest/index";
import SuperviseDuplicateRequestInfoDialog from "components/Hybrids/SupervisionRequest/SuperviseDuplicateRequestInfoDialog";
import {
  handleOnFailedReqForSupervision,
  supervisionSearchParams,
} from "components/Hybrids/SupervisionRequest/helpers";
import { getObjectsDifference, isNullOrUndefined } from "utilities/helpers/generalHelper";
import { PAGE_URL_SETTING } from "utilities/constants/localStorage/index";
import { useSplitterCollapseData } from "views/Common/SplitterCollapseHook/helper";
import tryParse from "utilities/helpers/jsonTryParse";
import { getEncodedParamFromString, getObjectFromString, makeSearchParams } from "router/routing";
import {
  RENTAL_DAYS_PER_WEEK,
  RENTAL_DISCOUNT_PCT,
} from "views/OrderProcessing/Order/RentalOrder/RentalOrderScreen/RentalOrderRightSide/getDisplayTotalItems";
import {
  ADD_RENTAL_TRUCK_PERMISSION,
  ORDER_PRINT_PULL_LIST_PERMISSION,
  ORDER_PRINT_QUICK_LIST_PERMISSION,
  ORDER_PRINT_QUOTE_SHEET_PERMISSION,
  ORDER_PRINT_SUBRENTAL_PO_PERMISSION,
  RENTAL_CHECKOUT_SCREEN_PERMISSION,
  RENTAL_ORDER_LOCK_UNLOCK_PERMISSION,
  SAVE_AS_RENTAL_TRUCK_PERMISSION,
} from "utilities/constants/permissions/index";
import { BOOKMARK_EDIT, BOOKMARK_INSERT } from "components/Hybrids/Grid/Utils/Constants/index";
import { setBookMark } from "components/Hybrids/Grid/Features/EventHandlers/generalEventHandler";
import isEmpty from "lodash/isEmpty";
import { sendLocalMessage } from "utilities/localMessage/index";
import { PARENT_SUFFIX } from "components/Hybrids/ToolsBox/ToolsBoxPinnedItems/PinnedContext";
import { orderInformationBoxItems } from "components/Hybrids/InformationBox/InformationBoxConstance";
import { isAppDirty } from "components/Hybrids/Forms/helpers";
import store from "store/index";

export const RENTAL_ORDER = "rentalOrder";
const FORM_NAME = "rentalOrder";
const pageTitle = RENTAL_ORDER_SIDE_BAR_PAGE_TITLE;

function RentalOrder() {
  const { search } = useLocation();
  const orderNo = getEncodedParamFromString("orderNo", search);
  const { AvailableMode, ...available } = getObjectFromString(search);
  const dispatch = useDispatch();
  const mode = getLocalStorageSettings(PAGE_URL_SETTING, RENTAL_ORDER_MODE)?.mode ? "Ship" : "Pull";

  // general Order Header InformationP:
  const [orderHeader, setOrderHeader] = useState({});
  const [calculatedData, setCalculatedData] = useState(null);

  const [isShowOnlyMain, setIsShowOnlyMain] = useState(false);
  const [isRentalTotalLock, setIsRentalTotalLock] = useState(false);
  const [isShowExportCSVModal, setIsShowExportCSVModal] = useState(false);
  const [pickListModalProps, setPickListModalProps] = useState({
    visibility: false,
    AccessoryPickListVisibility: false,
  });
  const isHistory = orderHeader?.history;

  const [subrentalPicklistModalProps, setSubrentalPickListModalProps] = useState({ isVisible: false });
  const [subrentalRecordsModalProps, setSubrentalRecordsModalProps] = useState({ isOpen: false });
  const [barcodeFocusKey, setBarcodeFocusKey] = useState();
  //Dialog
  const [isOpenDialog, setIsOpenDialog] = useState("");
  const [dialogState, setDialogState] = useState({
    dialogType: null,
    onConfirm: null,
    ColumnStateName: null,
  });

  const [isOpenCollapse, setIsOpenCollapse, splitClassName] = useSplitterCollapseData();

  // Loading Page Handler
  const rentalOrderPageSetting = getPageSetting(pageTitle);

  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  const [isRecalculateActive, setIsRecalculateActive] = useState(!rentalOrderPageSetting);
  const [isNoChargeDays, setIsNoChargeDays] = useState(false);
  const [noChargeDays, setNoChargeDays] = useState([]);

  const [isOpenDnd, setIsOpenDnd] = useState(rentalOrderPageSetting?.isOpenDnd);

  const [availabilityCheckbox, setAvailabilityCheckbox] = useState(DEFAULT_AVAILABILITY_CHECKBOX);
  const [updatesubrental, setUpdatesubrental] = useState({});
  const [modified, setModified] = useState(false);
  const [supervisionDialog, setSupervisionDialog] = useState({});
  const [availableMode, setAvailableMode] = useState(isNullOrUndefined(mode) ? "Pull" : mode);
  const [supervisedValue, setSupervisedValue] = useState(null);

  const currencySymbol = useRelatedSymbolFromCurrency({
    currencyId: orderHeader?.currencyId,
  });

  const subrentalModalRef = useRef();
  const rentalItemsGridRef = useRef();
  const rentalMiscGridRef = useRef();
  const updateRef = useRef({});
  const ref = useRef();
  const accessoryPickListModalRef = useRef();

  useEffect(() => {
    openRentalOrder({ orderNo, setSupervisionDialog, openDialogWithType, setDialogState });
  }, [orderNo]);

  useEffect(() => {
    updatePageSetting(
      {
        isOpenDnd,
      },
      pageTitle
    );
  }, [isOpenDnd]);

  const isMobile = useIsMobile(undefined, () => setIsOpenSidebar(false));
  const changeRouteHandler = () => sendLocalMessage("router_prompt_submit", { onAfterErrors: { hasError: false } });
  const {
    useImage,
    useMonthlyBilling,
    allowMultipleReservationOnBarcode,
    hasGridDataRentalItem,
    hasGridDataMisc,
    useNoChargeDays,
    useCurrency,
    warnCreditLimitRentalTlr,
    warnIfExceedSubrentalLimit,
    isShowSalesOrderButton,
    isLocked,
    rightSideformInitialValues,
    hasEditRentalOrderScreenPermission,
    hasOrderBillingSchedulePermission,
    hasShippingChargesPermission,
    hasLockUnlockRentalOrderRowsPermission,
    hasAddRentalTruckPermission,
    hasSaveAsRentalTruckPermission,
    hasRentalCheckoutScreenPermission,
    hasSubRentalRecordsPermission,
    hasPrintQuickListPermission,
    hasPrintPullListPermission,
    hasPrintQuoteSheetPermission,
    hasPrintSubrentalPOPermission,
    isMultiLocation,
  } = useAppSelector((state) => ({
    useImage: state?.setupReducer?.useImage,
    useMonthlyBilling: state?.setupReducer?.useMonthlyBilling,
    allowMultipleReservationOnBarcode: state?.setupReducer?.allowMultipleReservationOnBarcode,
    useCurrency: state?.setupReducer?.useCurrency,
    hasGridDataRentalItem: state?.gridMetaDataReducer?.[RENTAL_ITEMS_COLUMN_STATE_NAME]?.hasData,
    hasGridDataMisc: state?.gridMetaDataReducer?.[RENTAL_ORDER_MISC_COLUMN_STATE_NAME]?.hasData,
    useNoChargeDays: state?.setupReducer?.useNoChargeDays,
    warnCreditLimitRentalTlr: state?.setupReducer?.warnCreditLimitRentalTlr,
    warnIfExceedSubrentalLimit: state?.setupReducer?.warnIfExceedSubrentalLimit,
    isShowSalesOrderButton: state?.securityReducer?.["fmOrdrProc.ASalesTlr"],
    isLocked: getFormValues(RENTAL_ORDER_RIGHT_SIDE_FORM_NAME)(state)?.locked,
    rightSideformInitialValues: getFormInitialValues(RENTAL_ORDER_RIGHT_SIDE_FORM_NAME)(state),
    hasEditRentalOrderScreenPermission: state?.securityReducer?.editRentalOrderScreen,
    hasOrderBillingSchedulePermission: state?.securityReducer?.orderBillingSchedule,
    hasShippingChargesPermission: state?.securityReducer?.shippingCharges,
    hasLockUnlockRentalOrderRowsPermission: state?.securityReducer?.[RENTAL_ORDER_LOCK_UNLOCK_PERMISSION],
    hasAddRentalTruckPermission: state?.securityReducer?.[ADD_RENTAL_TRUCK_PERMISSION],
    hasSaveAsRentalTruckPermission: state?.securityReducer?.[SAVE_AS_RENTAL_TRUCK_PERMISSION],
    hasRentalCheckoutScreenPermission: state?.securityReducer?.[RENTAL_CHECKOUT_SCREEN_PERMISSION],
    hasSubRentalRecordsPermission: state?.securityReducer?.subrentalRecords,
    hasPrintQuickListPermission: state?.securityReducer?.[ORDER_PRINT_QUICK_LIST_PERMISSION],
    hasPrintPullListPermission: state?.securityReducer?.[ORDER_PRINT_PULL_LIST_PERMISSION],
    hasPrintQuoteSheetPermission: state?.securityReducer?.[ORDER_PRINT_QUOTE_SHEET_PERMISSION],
    hasPrintSubrentalPOPermission: state?.securityReducer?.[ORDER_PRINT_SUBRENTAL_PO_PERMISSION],
    isMultiLocation: !!state?.setupReducer?.multiLocation,
    rightSideFormValues: getFormValues(RentalOrderRightSideFormName)(state),
  }));
  const {
    subNoPrompt,
    subVendBegDateUpdate: vendorBeginDateUpdate,
    subVendEndDateUpdate: vendorEndDateUpdate,
    subVendDaysPerWeekUpdate: vendorDaysPerWeekUpdate,
    subVendDiscPctUpdate: vendorDiscountPercentUpdate,
    subVendListUpdate: vendorListUpdate,
    subVendActualUpdate: vendorActualUpdate,
    subCustBegDateUpdate: customerBeginDateUpdate,
    subCustEndDateUpdate: customerEndDateUpdate,
    subCustDaysPerWeekUpdate: customerDaysPerWeekUpdate,
    subCustDiscPctUpdate: customerDiscountPercentUpdate,
    subCustListUpdate: customerListUpdate,
    subCustActualUpdate: customerActualUpdate,
    useSeparateDatesForEachLineItemOnRentalTlr,
  } = useAppSelector((state) => state?.setupReducer);
  const preventClose =
    (warnCreditLimitRentalTlr &&
      !isHistory &&
      (orderHeader?.orderType === "Order" ||
        orderHeader?.orderType === "Quote" ||
        orderHeader?.orderType === "Reservation")) ||
    (warnIfExceedSubrentalLimit && orderHeader?.subrentalLimitPct && !isHistory && modified);

  const updateRentalTotalLock = (lockState) => {
    setIsRentalTotalLock(lockState);
  };

  const openDialogWithType = ({
    dialogType,
    onConfirm,
    onDecline,
    ColumnStateName,
    recNo,
    extraData,
    message,
    contentKeys,
    callDeclineOnClose,
  }) => {
    setDialogState({
      dialogType,
      onConfirm,
      ColumnStateName,
      onDecline,
      extraData,
      message,
      contentKeys,
      callDeclineOnClose,
    });
    setIsOpenDialog(true);
  };

  const getSelectedRowsByColumnStateName = (ColumnStateName) => {
    const rentalItemsGridApi = getRef(rentalItemsGridRef, "api");
    const rentalMiscGridApi = getRef(rentalMiscGridRef, "api");
    let selectedRows = [];
    if (ColumnStateName === RENTAL_ITEMS_COLUMN_STATE_NAME) {
      selectedRows = getCurrentAndSelectedRowsNode(rentalItemsGridApi);
    } else {
      selectedRows = getCurrentAndSelectedRowsNode(rentalMiscGridApi);
    }
    return selectedRows;
  };

  const onSuccessWithSetData = (ColumnStateName, response) => {
    if (ColumnStateName === RENTAL_ITEMS_COLUMN_STATE_NAME) {
      handleRefreshRentalItemsGrid();
    } else if (ColumnStateName === RENTAL_ORDER_MISC_COLUMN_STATE_NAME) {
      handleRefreshMiscGrid();
    }
  };
  const handleRefreshMiscGrid = useCallback((closeRightSide = true, bookmark) => {
    const gridApi = getRef(rentalMiscGridRef);
    if (!gridApi) return;
    const {
      inlineEditApi: { reset },
    } = getGridContext(gridApi);
    onRefreshGrid(gridApi, bookmark);
    reset();
    if (!isNullOrUndefined(closeRightSide)) setIsOpenSidebar(!closeRightSide);
  }, []);

  const handleRefreshRentalItemsGrid = useCallback((closeRightSide = true, bookmark, refreshId, isAutoBookmark) => {
    const gridApi = getRef(rentalItemsGridRef);
    if (!gridApi) return;
    const {
      inlineEditApi: { reset },
    } = getGridContext(gridApi);
    if (isAutoBookmark) refreshWithAutoBookmark(gridApi, refreshId);
    else onRefreshGrid(gridApi, bookmark, refreshId);
    reset();
    if (!isNullOrUndefined(closeRightSide)) setIsOpenSidebar(!closeRightSide);
  }, []);
  // event listener from subrental pick to update the grid data
  window.popupUpdate = () => {
    handleRefreshRentalItemsGrid(true);
  };
  const onSuccessWithRefreshGrids = useCallback(
    ({ ColumnStateName, closeRightSide }) => {
      if (ColumnStateName === RENTAL_ITEMS_COLUMN_STATE_NAME) {
        handleRefreshRentalItemsGrid?.(closeRightSide);
      } else if (ColumnStateName === RENTAL_ORDER_MISC_COLUMN_STATE_NAME) {
        handleRefreshMiscGrid?.(closeRightSide);
      } else {
        handleRefreshRentalItemsGrid?.(closeRightSide);
        handleRefreshMiscGrid?.(closeRightSide);
      }
    },
    [handleRefreshMiscGrid, handleRefreshRentalItemsGrid]
  );

  // Handle Charge Days Functions
  const onSuccessGetAllNoChargeDays = (data) => {
    const dates = data?.model?.dateList?.map((item) => item?.split("T")?.[0]);
    setNoChargeDays(dates);
    setIsNoChargeDays(true);
    return;
  };

  const handleOpenNoChargeDays = useCallback(() => {
    postRequestToServer({
      address: GET_ALL_NO_CHARGE_DAYS,
      dataEntry: {
        entityFilters: {
          OrderNo: orderNo,
        },
      },
      onSuccess: onSuccessGetAllNoChargeDays,
    });
    return;
  }, [orderNo]);

  const handleCancelNoChargeDays = () => {
    setNoChargeDays([]);
    return setIsNoChargeDays(false);
  };

  const handleCloseNoChargeDays = (dates) => {
    return postRequestToServer({
      address: UPDATE_NO_CHARGE_DAYS,
      dataEntry: {
        OrderNo: orderNo,
        DateList: dates?.map((item) => getServerFormateDate(item)).join(","),
      },
      onSuccess: handleCancelNoChargeDays,
    });
  };
  const subNoPromptRequest = useCallback(
    (isFetch = true) => {
      const dataEntry = {
        orderNo,
        vendorBeginDateUpdate,
        vendorEndDateUpdate,
        vendorDaysPerWeekUpdate,
        vendorDiscountPercentUpdate,
        vendorListUpdate,
        vendorActualUpdate,
        customerBeginDateUpdate,
        customerEndDateUpdate,
        customerDaysPerWeekUpdate,
        customerDiscountPercentUpdate,
        customerListUpdate,
        customerActualUpdate,
      };
      if (isFetch) {
        fetchApiSendRequest({ address: SUBRENTAL_UPDATE_ITEMS, dataEntry, method: "PUT" });
      } else {
        putRequestToServer({ address: SUBRENTAL_UPDATE_ITEMS, dataEntry });
      }
    },
    [
      customerActualUpdate,
      customerBeginDateUpdate,
      customerDaysPerWeekUpdate,
      customerDiscountPercentUpdate,
      customerEndDateUpdate,
      customerListUpdate,
      orderNo,
      vendorActualUpdate,
      vendorBeginDateUpdate,
      vendorDaysPerWeekUpdate,
      vendorDiscountPercentUpdate,
      vendorEndDateUpdate,
      vendorListUpdate,
    ]
  );

  const onSuccessGetOrderHeader = useCallback((response) => {
    const orderHeaderResponse = response?.model;
    setOrderHeader(orderHeaderResponse);
    setIsRentalTotalLock(orderHeaderResponse?.rentalTotalLock);
    return;
  }, []);

  const refreshOrderHeader = useCallback(() => {
    getRequestToServer({ address: GET_ORDER_HEADER + "/" + orderNo, onSuccess: onSuccessGetOrderHeader });
  }, [onSuccessGetOrderHeader, orderNo]);

  useEffect(() => {
    refreshOrderHeader();
  }, [refreshOrderHeader]);

  const recalculateOrder = useCallback(
    (closeRightSide = false, isModified = modified, afterSuccess) => {
      const calculatePayload = {
        OrderNo: orderNo,
        ReturnTotals: true,
        TaxIncluded: false,
      };
      putRequestToServer({
        address: RENTAL_ORDER_RECALCULATE,
        dataEntry: calculatePayload,
        onSuccess: (response) => {
          setCalculatedData(response?.model);
          refreshOrderHeader();
          onSuccessWithRefreshGrids?.({ closeRightSide });
          if (orderHeader?.hasSubrental) {
            if (subNoPrompt) {
              subNoPromptRequest();
              afterSuccess?.();
            } else {
              setUpdatesubrental({
                isOpen: !isHistory && isModified,
                shouldBeRoute: afterSuccess,
              });
            }
          } else afterSuccess?.();
        },
      });
    },
    [
      orderNo,
      refreshOrderHeader,
      onSuccessWithRefreshGrids,
      subNoPrompt,
      subNoPromptRequest,
      isHistory,
      modified,
      orderHeader?.hasSubrental,
    ]
  );

  const onFailedUpdateForSupervision = ({ res, formInitialValues }) => {
    const code = res?.response?.data?.messages?.[0]?.code;
    const payload = tryParse(res?.config?.data);
    const onDidError = ({ displayMessage, hasTranslation = false }) => {
      openDialogWithType({
        dialogType: INLINE_GENERAL_ERROR_MESSAGE,
        ColumnStateName: RENTAL_ITEMS_COLUMN_STATE_NAME,
      });
      setDialogState((prevState) => {
        return { ...prevState, extraData: displayMessage, hasTranslation };
      });
    };
    if (code === "1" && payload?.daysPerWeek === "0") {
      onDidError({ displayMessage: "YOU_ARE_NOT_ALLOWED_TO_SET_DAYS_PER_WEEK_BELOW_VALUE", hasTranslation: true });
      return;
    }
    const modeName = code === "2" ? RENTAL_DISCOUNT_PCT : RENTAL_DAYS_PER_WEEK;
    const urlParams = makeSearchParams({
      [supervisionSearchParams.MODENAME]: modeName,
      [supervisionSearchParams.SUPERVISIONTARGETFORM]: RENTAL_ORDER_RIGHT_SIDE_FORM_NAME,
    });

    const displayMessage = res?.response?.data?.messages?.map((x) => x?.text);
    handleOnFailedReqForSupervision({
      displayMessage,
      didError: res?.response?.data?.didError,
      orderNo: payload?.orderNo,
      [supervisionSearchParams.REALNUM]: code === "2" ? payload?.rentalDiscPct : payload?.daysPerWeek,
      code,
      setSupervisionDialog,
      onDidError,
      urlParams,
      cancelCurrentChanges: () => {
        dispatch(change(RENTAL_ORDER_RIGHT_SIDE_FORM_NAME, modeName, formInitialValues[modeName]));
      },
    });
  };

  const updateOrder = useCallback(
    (updatedData, onSuccess, onFailed) => {
      const payload = {
        ...getRentalOrderUrlParams(),
        orderNo: orderHeader?.orderNo,
        shipMethodId: updatedData?.shipMethodId,
        returnMethodId: updatedData?.returnMethodId,
        rentalDiscPct: updatedData?.rentalDiscPct,
        daysPerWeek: updatedData?.daysPerWeek,
        rentalPriceListId: updatedData?.rentalPriceListId,
        locked: updatedData?.locked,
        pullDate: orderHeader?.pullDate,
        shipDate: updatedData?.shipDate,
        returnDate: updatedData?.returnDate,
        usageBeginDate: updatedData?.usageBegDate,
        usageEndDate: updatedData?.usageEndDate,
        priceListChanged: updatedData?.rentalPriceListId !== orderHeader?.rentalPriceListId,
      };

      putRequestToServer({
        address: RENTAL_ORDER_UPDATE_ORDER,
        dataEntry: payload,
        onSuccess: (response) => {
          onSuccess?.(response);
          // HINT: [Mohsen Hajibeigloo] After we updated the order we should update orderHeader state as well. so when user opens the right side again the right side have the correct initial values
          setOrderHeader((prevState) => {
            return {
              ...prevState,
              shipMethodId: updatedData?.shipMethodId,
              returnMethodId: updatedData?.returnMethodId,
              rentalDiscPct: updatedData?.rentalDiscPct,
              daysPerWeek: updatedData?.daysPerWeek,
              rentalPriceListId: updatedData?.rentalPriceListId,
              locked: updatedData?.locked,
              shipDate: updatedData?.shipDate,
              returnDate: updatedData?.returnDate,
              usageBegDate: updatedData?.usageBegDate,
              usageEndDate: updatedData?.usageEndDate,
            };
          });
        },
        onFailed: (res) => {
          onFailed?.(res);
          onFailedUpdateForSupervision({ res, formInitialValues: rightSideformInitialValues });
        },
        extraHeaders: { doNotHandleErrorMassege: true },
      });
    },
    [orderHeader?.orderNo, orderHeader?.pullDate, orderHeader?.rentalPriceListId]
  );

  const externalHandleClose = () => {
    setIsOpenSidebar(!isOpenSidebar);
    hasEditRentalOrderScreenPermission && dispatch(submit(RENTAL_ORDER_RIGHT_SIDE_FORM_NAME));
  };
  const externalHandleOpen = () => {
    setIsOpenSidebar(!isOpenSidebar);
    recalculateOrder?.(false, false);
  };
  const handleClickSidebarButton = () => {
    const next = isOpenSidebar ? externalHandleClose : externalHandleOpen;
    updateRef.current = { next, count: 0 };
    if (getRef(rentalItemsGridRef)?.getEditingCells()?.length) {
      getRef(rentalItemsGridRef).stopEditing();
      updateRef.current.count++;
    }
    if (getRef(rentalMiscGridRef)?.getEditingCells()?.length) {
      getRef(rentalMiscGridRef).stopEditing();
      updateRef.current.count++;
    }
    if (updateRef.current.count === 0) {
      next();
    }
  };

  const onSubmit = (formValues) => {
    const afterSuccess = () => {
      if (formValues?.shouldBeRoute) {
        preventClose ? closeRentalOrder(orderNo, changeRouteHandler) : changeRouteHandler();
      }
    };
    const update = (payload = formValues) => {
      updateOrder(
        payload,
        () => {
          if (
            orderHeader?.rentalDiscPct !== formValues?.rentalDiscPct ||
            orderHeader?.daysPerWeek !== formValues?.daysPerWeek ||
            orderHeader?.usageBegDate !== formValues?.usageBegDate ||
            orderHeader?.usageEndDate !== formValues?.usageEndDate
          ) {
            recalculateOrder?.(null, true, afterSuccess);
            if (supervisedValue) setSupervisedValue(null);
          } else {
            recalculateOrder?.(isOpenSidebar, false, afterSuccess);
          }
        },
        () => {
          dispatch(reset(RentalOrderRightSideFormName));
        }
      );
    };

    const onDecline = () => {
      dispatch(change(RentalOrderRightSideFormName, "rentalPriceListId", orderHeader?.rentalPriceListId));
      update({ ...formValues, rentalPriceListId: orderHeader?.rentalPriceListId });
    };

    if (orderHeader?.rentalPriceListId !== formValues?.rentalPriceListId) {
      openDialogWithType({ dialogType: CHANGE_PRICE_LIST_DIALOG, onConfirm: update, onDecline });
    } else {
      update();
    }
  };

  const getDefaultRowId = () => {
    const gridApi = getRef(rentalItemsGridRef, "api");
    return getCurrentRowData(gridApi)?.id;
  };

  useEffect(() => {
    updatePageSetting(
      {
        isOpenSidebar,
      },
      FORM_NAME
    );
  }, [isOpenSidebar]);

  const rentalOrderToolsItem = useMemo(() => {
    return toolsItemList({
      orderHeader,
      openDialogWithType,
      handleRefreshRentalItemsGrid,
      handleRefreshMiscGrid,
      isShowOnlyMain,
      setIsShowOnlyMain,
      handleOpenNoChargeDays,
      useMonthlyBilling,
      allowMultipleReservationOnBarcode,
      rentalItemsGridRef,
      rentalMiscGridRef,
      currentAvailableMode: availableMode,
      setIsShowExportCSVModal,
      setAvailabilityCheckbox,
      setPickListModalProps,
      handleClickSidebarButton,
      orderType: orderHeader?.orderType,
      hasTransfer: Boolean(orderHeader?.transferToId),
      hasGridDataRentalItem,
      hasGridDataMisc,
      setSubrentalPickListModalProps,
      currencyId: orderHeader?.currencyId,
      useNoChargeDays,
      isHistory,
      useCurrency,
      setSubrentalRecordsModalProps,
      isShowSalesOrderButton,
      isLocked,
      setSupervisionDialog,
      setDialogState,
      hasAddRentalTruckPermission,
      hasSaveAsRentalTruckPermission,
      hasRentalCheckoutScreenPermission,
      hasSubRentalRecordsPermission,
      hasEditRentalOrderScreenPermission,
      hasPrintQuickListPermission,
      hasPrintPullListPermission,
      hasPrintQuoteSheetPermission,
      hasPrintSubrentalPOPermission,
    });
  }, [
    orderHeader,
    useCurrency,
    handleRefreshRentalItemsGrid,
    handleRefreshMiscGrid,
    isShowOnlyMain,
    handleOpenNoChargeDays,
    useMonthlyBilling,
    allowMultipleReservationOnBarcode,
    isHistory,
    hasGridDataRentalItem,
    hasGridDataMisc,
    useNoChargeDays,
    availableMode,
    isLocked,
    hasRentalCheckoutScreenPermission,
  ]);

  // =========================================================
  const checkModified = (oldValues, newValues) => {
    if (!oldValues && !newValues) {
      setModified(false);
      return;
    }
    if (!modified) {
      const modifiedCondition =
        isEmpty(oldValues) ||
        !isEmpty(getObjectsDifference(oldValues, newValues)) ||
        (parseFloat(oldValues?.subOrdered ?? 0) > 0 &&
          (orderHeader?.usageBeginDate !== newValues?.usageBeginDate ||
            orderHeader?.usageEndDate !== newValues?.usageEndDate ||
            orderHeader?.rentalDiscPct !== newValues?.discountPercentage ||
            orderHeader?.daysPerWeek !== newValues?.daysPerWeek));
      setModified(modifiedCondition);
    }
  };
  const onAfterPostCB = ({ payload, gridApi, result }) => {
    const newValues = payload?.newValues ?? payload;
    const oldValues = payload?.oldValues;

    if (result?.error) return;
    if (
      oldValues &&
      useSeparateDatesForEachLineItemOnRentalTlr &&
      parseFloat(oldValues?.subOrdered ?? 0) > 0 &&
      (oldValues?.usageBeginDate !== newValues?.usageBeginDate || oldValues?.usageEndDate !== newValues?.usageEndDate)
    ) {
      subNoPrompt
        ? subNoPromptRequest(false)
        : setUpdatesubrental({
            isOpen: true,
            recNo: oldValues?.id,
            isUpdateVendor: true,
            gridApi,
          });
    } else if (parseFloat(oldValues?.subOrdered ?? 0) > 0 && newValues?.locked) {
      subNoPrompt
        ? subNoPromptRequest(false)
        : setUpdatesubrental({
            isOpen: true,
            recNo: oldValues?.id,
            gridApi,
          });
    }
    checkModified(oldValues ?? {}, newValues);
    if (updateRef.current.count) {
      updateRef.current.count--;
      if (updateRef.current.count === 0) updateRef.current.next();
    }
  };

  const onRowEditingStopped = ({ hasEditedRow }) => {
    if (!hasEditedRow && updateRef.current.count) {
      updateRef.current.count--;
      if (updateRef.current.count === 0) updateRef.current.next();
    }
  };

  const onRowEditingStarted = ({ api }) => {
    if (isOpenSidebar) {
      const isEditing = api?.getEditingCells()?.length;
      const currentRow = getCurrentRowData(api) ?? {};
      const { columnStateName } = getGridContext(api);
      const bookMark = currentRow?.rowState?.insert
        ? { mode: BOOKMARK_INSERT }
        : { mode: isEditing ? BOOKMARK_EDIT : null, id: currentRow.id };
      setBookMark({ columnStateName, bookMark });
      api.stopEditing();
      externalHandleClose();
    }
  };

  useEffect(() => {
    setIsOpenDnd(false);
    if (!isNullOrUndefined(rentalItemsGridRef?.current)) {
      const gridApiRentalItems = getRef(rentalItemsGridRef, "api");
      const isEditing = !!gridApiRentalItems?.getEditingCells()?.length;
      isEditing && gridApiRentalItems?.stopEditing();
    }
    if (!isNullOrUndefined(rentalMiscGridRef?.current)) {
      const gridApiRentalMisc = getRef(rentalMiscGridRef, "api");
      const isEditing = !!gridApiRentalMisc?.getEditingCells()?.length;
      isEditing && gridApiRentalMisc?.stopEditing();
    }
  }, [isLocked]);

  useBeforeUnload(
    useCallback(() => {
      if (orderHeader?.hasSubrental && subNoPrompt) {
        subNoPromptRequest();
      }
      return !isHistory && modified;
    }, [orderHeader?.hasSubrental, isHistory, modified, subNoPrompt, subNoPromptRequest])
  );

  // =========================================================

  const sidebarContent = (
    <RentalOrderRightSide
      orderHeader={orderHeader}
      calculatedData={calculatedData}
      recalculateOrder={recalculateOrder}
      openDialogWithType={openDialogWithType}
      onSubmit={onSubmit}
      updateOrder={updateOrder}
      handleRefreshRentalItemsGrid={handleRefreshRentalItemsGrid}
      onSuccessWithRefreshGrids={onSuccessWithRefreshGrids}
      isRentalTotalLock={isRentalTotalLock}
      currencySymbol={currencySymbol}
      isHistory={isHistory}
      setIsOpenSidebar={setIsOpenSidebar}
      barcodeFocusKey={barcodeFocusKey}
      hasEditRentalOrderScreenPermission={hasEditRentalOrderScreenPermission}
      hasOrderBillingSchedulePermission={hasOrderBillingSchedulePermission}
      hasShippingChargesPermission={hasShippingChargesPermission}
      supervisedValue={supervisedValue}
      setSupervisedValue={setSupervisedValue}
    />
  );
  const header = (
    <div className="page-title-action-bar-wrapper">
      <PageTitle
        title={pageTitle}
        isShowTitleTag={isHistory}
        isShowLockTag={isLocked}
        recentScreenDetailIdentifier="orderNo"
        hasLeftPadding={true}
        className="fit-width"
        rightIconItems={[
          {
            key: 1,
            wrapperClassNames: "detail-sidebar-opener",
            tooltipTitle: isOpenSidebar ? "CLOSE_DETAIL" : "OPEN_DETAIL",
            tooltipStyle: { position: "fixed" },
            iconType: isOpenSidebar ? "icon-detail-close" : "icon-sum",
            iconSize: LARGE_SIZE,
            iconClassName: "detail-sidebar-icons",
            handleClick: handleClickSidebarButton,
          },
        ]}
        shortcutManage={{ hasShortcut: true, toolsBoxName: FORM_NAME }}
      />
      <ToolsBox toolsBoxName={FORM_NAME} toolsItemList={rentalOrderToolsItem} />
    </div>
  );

  const RentalGrid = (
    <RentalItemsGridContainer
      orderHeader={orderHeader}
      gridRef={rentalItemsGridRef}
      isRecalculateActive={isRecalculateActive}
      setIsRecalculateActive={setIsRecalculateActive}
      hasUseImage={useImage}
      isShowOnlyMain={isShowOnlyMain}
      openDialogWithType={openDialogWithType}
      handleRefreshRentalItemsGrid={handleRefreshRentalItemsGrid}
      availabilityCheckbox={availabilityCheckbox}
      setAvailabilityCheckbox={setAvailabilityCheckbox}
      availableMode={availableMode}
      setAvailableMode={setAvailableMode}
      currencySymbol={currencySymbol}
      setPickListModalProps={setPickListModalProps}
      onAfterPostCB={onAfterPostCB}
      onRowEditingStopped={onRowEditingStopped}
      onRowEditingStarted={onRowEditingStarted}
      isHistory={isHistory}
      currencyId={orderHeader?.currencyId}
      setSupervisionDialog={setSupervisionDialog}
      setDialogState={setDialogState}
      isLocked={isLocked}
      onRefreshHandler={(refreshId) => {
        if (refreshId === INFORMATION_BARCODE_FOCUS) {
          setBarcodeFocusKey(Math.random());
        }
      }}
      hasEditRentalOrderScreenPermission={hasEditRentalOrderScreenPermission}
      hasLockUnlockRentalOrderRowsPermission={hasLockUnlockRentalOrderRowsPermission}
    />
  );

  const RentalMiscGrid = (
    <RentalMiscGridContainer
      orderHeader={orderHeader}
      gridRef={rentalMiscGridRef}
      handleRefreshMiscGrid={handleRefreshMiscGrid}
      openDialogWithType={openDialogWithType}
      availabilityCheckbox={availabilityCheckbox}
      availableMode={availableMode}
      onAfterPostCB={onAfterPostCB}
      onRowEditingStopped={onRowEditingStopped}
      onRowEditingStarted={onRowEditingStarted}
      isHistory={isHistory}
      setSupervisionDialog={setSupervisionDialog}
      setDialogState={setDialogState}
      isOpenCollapse={isOpenCollapse}
      isLocked={isLocked}
      setIsOpenCollapse={(x) => {
        setIsOpenCollapse(x);
      }}
      hasEditRentalOrderScreenPermission={hasEditRentalOrderScreenPermission}
      hasLockUnlockRentalOrderRowsPermission={hasLockUnlockRentalOrderRowsPermission}
    />
  );

  const mobileRightSide = isMobile ? <WrapperRightSide>{sidebarContent}</WrapperRightSide> : <></>;

  const columnOptions = {
    key: 123,
    fixedMinSize: 270,
    fixedMaxSize: 1020,
    relativeMinSize: 0.4,
    relativeMaxSize: 0.6,
    fixedDefaultSize: 254,
    isPrimary: false,
    splitClassName: !isOpenSidebar && "remove-resizer",
    fixedSize: isOpenSidebar && !isMobile ? undefined : 0,
    isResizable: isOpenSidebar,
  };

  const rootComponents = {
    rows: [
      {
        options: {
          key: 12,
          relativeMinSize: 0.3,
          relativeMaxSize: 0.7,
          splitClassName,
        },
        content: RentalGrid,
      },
      {
        options: {
          key: 13,
        },
        content: RentalMiscGrid,
      },
    ],
  };

  const SplitterItems = {
    columns: [
      {
        options: columnOptions,
        content: (
          <div className="flex-column fit-height">
            {header}
            <div className="top-grid-container">
              <InformationBox items={orderInformationBoxItems(orderHeader, isMultiLocation)} hasSideMargin={true} />
              <div className="rental-items-grid-container">
                {isMobile || isHistory ? (
                  <MainSplitter prefix="rental_order_screen_grids" root={rootComponents} />
                ) : (
                  <DragAndDropGridContainer
                    dndType={RENTAL_WITH_KIT_AND_TRUCK}
                    orderInfo={{ location: orderHeader?.locationId, currency: orderHeader?.currencyId }}
                    truckID={orderNo}
                    treeDataModel={(data) => {
                      return dragAndDropTreeDataModel(data, orderNo);
                    }}
                    isOpenDnd={!isLocked && isOpenDnd}
                    setIsOpenDnd={setIsOpenDnd}
                    isLock={isLocked || !hasEditRentalOrderScreenPermission}
                  >
                    <MainSplitter prefix="rental_order_screen_grids" root={rootComponents} />
                  </DragAndDropGridContainer>
                )}
                {mobileRightSide}
              </div>
            </div>
          </div>
        ),
      },
      {
        options: {
          key: 17,
        },
        content: !isMobile && sidebarContent,
      },
    ],
  };

  window.popupUpdate = () => {
    const gridApi = getRef(rentalItemsGridRef, "api");
    onRefreshGrid(gridApi);
  };

  const _RouterPromptFunc = useCallback(() => {
    const { orderType, hasSubrental, productionId, currencyId } = orderHeader || {};
    const creditLimit =
      warnCreditLimitRentalTlr &&
      !isHistory &&
      (orderType === "Order" || orderType === "Quote" || orderType === "Reservation");

    if (isHistory) return;
    if (isAppDirty(RentalOrderRightSideFormName)) {
      const state = store.getState();
      const rightSideFormValues = getFormValues(RentalOrderRightSideFormName)(state);
      onSubmit({ ...rightSideFormValues, shouldBeRoute: true });
    } else {
      const onBeforeRoute = () => {
        if (hasSubrental && modified) {
          if (subNoPrompt) {
            checkWarnSubrentalLimit({ orderNo, currencyId, changeRouteHandler });
            subNoPromptRequest();
          } else {
            setUpdatesubrental({
              isOpen: true,
            });
          }
        } else changeRouteHandler?.();
      };
      if (creditLimit) {
        checkWarnCreditLimit({
          orderNo,
          productionId,
          changeRouteHandler: onBeforeRoute,
        });
      } else onBeforeRoute();
    }
  }, [modified, orderHeader]);

  //************************************************* Revision *************************************************
  useRevision(orderNo);

  //************************************************* Elements *************************************************
  if (isHistory !== undefined)
    return (
      <div className="rental-order-container">
        {isNoChargeDays && (
          <NoChargeDays
            currentDate={orderHeader?.usageBegDate}
            value={noChargeDays}
            weekends={[0, 6]}
            minDate={orderHeader?.usageBegDate}
            maxDate={orderHeader?.usageEndDate}
            handleClose={handleCloseNoChargeDays}
            handleCancel={handleCancelNoChargeDays}
          />
        )}
        {isOpenDialog && (
          <DialogManager
            available={available}
            setIsOpenDialog={(status) => {
              setIsOpenDialog(status);
              setBarcodeFocusKey(Math.random());
            }}
            calculatedData={calculatedData}
            orderHeader={orderHeader}
            rentalItemsGridRef={rentalItemsGridRef}
            rentalMiscGridRef={rentalMiscGridRef}
            getSelectedRowsByColumnStateName={getSelectedRowsByColumnStateName}
            dialogState={dialogState}
            onSuccessWithRefreshGrids={onSuccessWithRefreshGrids}
            onSuccessWithSetData={onSuccessWithSetData}
            recalculateOrder={recalculateOrder}
            isRentalTotalLock={isRentalTotalLock}
            updateRentalTotalLock={updateRentalTotalLock}
            currencySymbol={currencySymbol}
            isHistory={isHistory}
            openDialogWithType={openDialogWithType}
            setDialogState={setDialogState}
          />
        )}
        {isShowExportCSVModal && (
          <ExportCSV setIsShowExportCSVModal={setIsShowExportCSVModal} orderNo={orderNo} exportFrom="rentalOrder" />
        )}
        {pickListModalProps.visibility && (
          <Modal
            content={
              <RentalEntryPick
                initialPayloadData={pickListModalProps?.data}
                setPickListModalProps={setPickListModalProps}
                handleRefreshRentalItemsGrid={(closeRightSide, bookmark, refreshId) =>
                  handleRefreshRentalItemsGrid(closeRightSide, bookmark, refreshId, true)
                }
                parentPage="FromRentalTlr"
                ref={ref}
                locationId={orderHeader?.locationId}
                locationDescription={orderHeader?.locationDescription}
                currencyId={orderHeader?.currencyId}
                getDefaultRowId={getDefaultRowId}
                confirmMessage="POST_CHANGES_TO_THE_ORDER"
                api={RENTAL_ENTRY_PICK_RENTAL}
              />
            }
            headerProps={{
              text: "RENTAL_ENTRY_PICK_LIST",
              shortcutManage: {
                hasShortcut: true,
                toolsBoxName: RENTAL_ENTRY_PICK_COLUMN_STATE_NAME + PARENT_SUFFIX,
              },
            }}
            handleClose={() => {
              ref?.current?.closeModal();
            }}
            isFullscreen={true}
            customClassName={"mass-non-coded-list-modal"}
          />
        )}
        {pickListModalProps.AccessoryPickListVisibility && (
          <Modal
            content={
              <AccessoryPickList
                params={pickListModalProps?.data}
                setPickListModalProps={setPickListModalProps}
                handleRefreshRentalItemsGrid={(closeRightSide, bookmark, refreshId) =>
                  handleRefreshRentalItemsGrid(closeRightSide, bookmark, refreshId, true)
                }
                PromptDialogMessage="UPDATE_ORDER_QUESTION"
                ref={accessoryPickListModalRef}
              />
            }
            headerProps={{
              text: "ACCESSORY_PICK_LIST",
              shortcutManage: {
                hasShortcut: true,
                toolsBoxName: ACCESSORY_PICK_LIST_COLUMN_STATE_NAME + PARENT_SUFFIX,
              },
            }}
            handleClose={({ isEscape }) => {
              if (isEscape) return;
              accessoryPickListModalRef.current?.close?.();
            }}
            isFullscreen={true}
            customClassName={"mass-non-coded-list-modal"}
          />
        )}
        {subrentalRecordsModalProps.isOpen && (
          <Modal
            content={
              <SubrentalRecords
                orderNo={subrentalRecordsModalProps?.orderNo}
                rentalDetailRecNo={subrentalRecordsModalProps?.rentalDetailRecNo}
                isMisc={subrentalRecordsModalProps?.isMisc}
                ref={subrentalModalRef}
                onClose={(isShowWarn) => {
                  const rentalItemsGridApi = getRef(rentalItemsGridRef, "api");
                  const rentalMiscGridApi = getRef(rentalMiscGridRef, "api");
                  onRefreshGrid(rentalItemsGridApi);
                  onRefreshGrid(rentalMiscGridApi);
                  setSubrentalRecordsModalProps({});
                  isShowWarn && checkWarnSubrentalLimit({ orderNo, currencyId: orderHeader?.currencyId });
                }}
              />
            }
            headerProps={{
              text: "SUBRENTAL_RECORDS_LIST",
              shortcutManage: { hasShortcut: true, toolsBoxName: SUBRENTAL_RECORDS_COLUMN_STATE_NAME + PARENT_SUFFIX },
            }}
            handleClose={() => {
              subrentalModalRef.current?.close?.();
            }}
            isFullscreen={true}
            customClassName="subrental-records-list-modal"
          />
        )}
        {subrentalPicklistModalProps.isVisible && (
          <Modal
            content={
              <SubrentalPickList
                handleRefreshBothGrid={() => {
                  handleRefreshRentalItemsGrid();
                  handleRefreshMiscGrid();
                }}
                setSubrentalPickListModalProps={setSubrentalPickListModalProps}
                isCloseClicked={subrentalPicklistModalProps?.isCloseClicked}
              />
            }
            headerProps={{
              text: "SUBRENTAL_PICK_LIST",
              shortcutManage: {
                hasShortcut: true,
                toolsBoxName: SUBRENTAL_PICK_LIST_COLUMN_STATE_NAME + PARENT_SUFFIX,
              },
            }}
            handleClose={() => {
              setSubrentalPickListModalProps((prev) => ({ ...prev, isCloseClicked: true }));
            }}
            isFullscreen={true}
            customClassName="mass-non-coded-list-modal"
          />
        )}
        {updatesubrental?.isOpen && (
          <UpdateSubrentalItemsDialog
            orderNo={orderHeader?.orderNo}
            recNo={updatesubrental?.recNo}
            onCancel={() => {
              setUpdatesubrental({});
              setModified(false);
              checkWarnSubrentalLimit({ orderNo, currencyId: orderHeader?.currencyId, changeRouteHandler });
            }}
            onSuccess={() => {
              onRefreshGrid(updatesubrental?.gridApi);
              setUpdatesubrental({});
              setModified(false);
              checkWarnSubrentalLimit({ orderNo, currencyId: orderHeader?.currencyId, changeRouteHandler });
            }}
            isUpdateVendor={updatesubrental?.isUpdateVendor}
          />
        )}
        {supervisionDialog?.isOpenNewRequest && (
          <SupervisionRequest
            initialValues={{
              production: orderHeader?.productionId,
              orderNo: supervisionDialog?.orderNo,
              equipment: supervisionDialog?.equipment,
              [supervisionSearchParams.REALNUM]: supervisionDialog?.[supervisionSearchParams.REALNUM],
            }}
            requestedFieldData={{
              recNo: supervisionDialog?.modeRecNo,
              displayMessage: supervisionDialog?.displayMessage,
              message: supervisionDialog?.message,
              urlParams: supervisionDialog?.urlParams,
              cancelCurrentChanges: supervisionDialog?.cancelCurrentChanges,
              cancelCurrentChangesForAll: supervisionDialog?.cancelCurrentChangesForAll,
            }}
            setDialogState={setSupervisionDialog}
          />
        )}
        {supervisionDialog?.isOpenDuplicateRequest && (
          <SuperviseDuplicateRequestInfoDialog
            supervisionInfo={supervisionDialog}
            setSupervisionInfo={setSupervisionDialog}
          />
        )}
        <RouterPrompt
          when={isAppDirty(RentalOrderRightSideFormName) || modified || preventClose}
          postDataOnChangeRoute={true}
          customPostOnClick={_RouterPromptFunc}
        />
        <MainSplitter prefix="rental_order_screen_main" root={SplitterItems} />
      </div>
    );
}

export default RentalOrder;
