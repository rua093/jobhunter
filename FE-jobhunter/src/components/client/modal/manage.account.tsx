import { Button, Col, Form, Input, Modal, Row, Select, Table, Tabs, message, notification, Popconfirm, Tooltip } from "antd";
import { isMobile } from "react-device-detect";
import type { TabsProps } from 'antd';
import { IResume, ISubscribers } from "@/types/backend";
import { useState, useEffect } from 'react';
import { callCreateSubscriber, callFetchAllSkill, callUpdateUser, callFetchResumeByUser, callGetSubscriberSkills, callUpdateSubscriber, callFetchAccount, callDeleteResume } from "@/config/api";
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { MonitorOutlined, ReloadOutlined } from "@ant-design/icons";
import { SKILLS_LIST } from "@/config/utils";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { fetchAccount, setUserLoginInfo } from "@/redux/slice/accountSlide";
import { ProForm } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import { DebounceSelect } from "@/components/admin/user/debouce.select";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    onSuccess?: () => void;
}
interface ISkillSelect {
    label: string;
    value: string;
    key?: string;
}

const UserResume = (props: any) => {
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);
    const [total, setTotal] = useState<number>(0);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<string>('');
    const [error, setError] = useState<string>('');

    const fetchResumes = async (page: number = 1, size: number = 5) => {
        setIsFetching(true);
        setError('');
        try {
            const query = `page=${page}&size=${size}`;
            const res = await callFetchResumeByUser(query);
            if (res && res.data) {
                setListCV(res.data.result as IResume[]);
                setTotal(res.data.meta?.total || 0);
            } else {
                setError('Không thể tải danh sách CV. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error fetching resumes:', error);
            setError('Có lỗi xảy ra khi tải danh sách CV. Vui lòng thử lại.');
        }
        setIsFetching(false);
    };

    useEffect(() => {
        fetchResumes(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        setSortField(sorter.field || '');
        setSortOrder(sorter.order || '');
    };

    const handleWithdrawCV = async (record: IResume) => {
        // Kiểm tra trạng thái CV
        if (record.status !== 'PENDING') {
            let errorMessage = '';
            switch (record.status) {
                case 'REVIEWING':
                    errorMessage = 'Không thể rút CV đang được xem xét. Vui lòng chờ kết quả từ nhà tuyển dụng.';
                    break;
                case 'APPROVED':
                    errorMessage = 'Không thể rút CV đã được duyệt. CV của bạn đã được chấp nhận.';
                    break;
                case 'REJECTED':
                    errorMessage = 'Không thể rút CV đã bị từ chối. CV này đã được xử lý.';
                    break;
                default:
                    errorMessage = 'Không thể rút CV với trạng thái hiện tại.';
            }
            notification.error({
                message: 'Không thể rút CV',
                description: errorMessage
            });
            return;
        }

        try {
            if (!record.id) {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: 'ID CV không hợp lệ.'
                });
                return;
            }
            
            const res = await callDeleteResume(record.id);
            if (res && res.statusCode === 200) {
                message.success('Rút CV thành công!');
                // Reload danh sách CV
                fetchResumes(currentPage, pageSize);
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res?.message || 'Không thể rút CV. Vui lòng thử lại.'
                });
            }
        } catch (error) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: 'Không thể rút CV. Vui lòng thử lại.'
            });
        }
    }

    const columns: ColumnsType<IResume> = [
        {
            title: 'STT',
            key: 'index',
            width: 50,
            align: "center",
            render: (text, record, index) => {
                return (
                    <>
                        {(index + 1)}
                    </>)
            }
        },
        {
            title: 'Công Ty',
            dataIndex: "companyName",
            sorter: (a, b) => a.companyName.localeCompare(b.companyName),
            sortDirections: ['ascend', 'descend'],
            render: (companyName: string) => {
                return companyName || 'N/A';
            }
        },
        {
            title: 'Job title',
            dataIndex: "job",
            sorter: (a, b) => a.job.name.localeCompare(b.job.name),
            sortDirections: ['ascend', 'descend'],
            render: (job: any) => {
                return job?.name || 'N/A';
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: "status",
            sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
            sortDirections: ['ascend', 'descend'],
            width: 120,
            render: (status: string) => {
                let color = '';
                let text = '';
                
                switch (status) {
                    case 'PENDING':
                        color = '#faad14';
                        text = 'Chờ xử lý';
                        break;
                    case 'REVIEWING':
                        color = '#1890ff';
                        text = 'Đang xem xét';
                        break;
                    case 'APPROVED':
                        color = '#52c41a';
                        text = 'Đã duyệt';
                        break;
                    case 'REJECTED':
                        color = '#ff4d4f';
                        text = 'Từ chối';
                        break;
                    case 'INTERVIEW':
                        color = '#1890ff';
                        text = 'Phỏng vấn';
                        break;
                    case 'HIRED':
                        color = '#722ed1';
                        text = 'Đã tuyển';
                        break;
                    default:
                        color = '#d9d9d9';
                        text = status || 'N/A';
                }
                
                return (
                    <span style={{ 
                        color: 'white', 
                        backgroundColor: color, 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                    }}>
                        {text}
                    </span>
                );
            },
        },
        {
            title: 'Ngày rải CV',
            dataIndex: "createdAt",
            sorter: (a, b) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aDate - bDate;
            },
            sortDirections: ['ascend', 'descend'],
            render(value, record, index) {
                return (
                    <>{dayjs(record.createdAt).format('DD-MM-YYYY HH:mm:ss')}</>
                )
            },
        },
        {
            title: '',
            dataIndex: "",
            render(value, record, index) {
                return (
                    <a
                        href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${record?.url}`}
                        target="_blank"
                    >Chi tiết</a>
                )
            },
        },
        {
            title: 'Thao tác',
            dataIndex: "actions",
            width: 100,
            render(value, record, index) {
                return (
                    <Popconfirm
                        title="Xác nhận rút CV"
                        description="Bạn có chắc chắn muốn rút CV này?"
                        onConfirm={() => handleWithdrawCV(record)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Rút CV">
                            <Button 
                                type="primary" 
                                danger 
                                size="small"
                            >
                                Rút CV
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                )
            }
        },
    ];

    return (
        <div>
            {error && (
                <div style={{ 
                    marginBottom: 16, 
                    padding: 12, 
                    backgroundColor: '#fff2f0', 
                    border: '1px solid #ffccc7', 
                    borderRadius: 6,
                    color: '#cf1322',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <Button 
                        type="primary" 
                        size="small" 
                        icon={<ReloadOutlined />}
                        onClick={() => fetchResumes(currentPage, pageSize)}
                    >
                        Thử lại
                    </Button>
                </div>
            )}
            <Table<IResume>
                columns={columns}
                dataSource={listCV}
                loading={isFetching}
                locale={{
                    emptyText: error ? 'Có lỗi xảy ra' : 'Chưa có CV nào được rải'
                }}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} CV`,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }
                }}
                onChange={handleTableChange}
                rowKey="id"
            />
        </div>
    )
}

const UserUpdateInfo = (props: { open: boolean; onSuccess?: () => void }) => {
    const [form] = ProForm.useForm();
    const user = useAppSelector(state => state.account.user);
    const dispatch = useAppDispatch();
    const [userInfo, setUserInfo] = useState<any>(user);
    const [optionsSkills, setOptionsSkills] = useState<ISkillSelect[]>([]);

    useEffect(() => {
        setUserInfo(user); // Cập nhật userInfo mỗi khi user thay đổi
    }, [user]);

    useEffect(() => {
        if (props.open) {
            setUserInfo(user); // Khi mở modal, cập nhật lại userInfo
        }
    }, [props.open, user]);

    useEffect(() => {
        if (userInfo) {
            console.log("userInfo received:", userInfo);
            // Xử lý skills để hiển thị tên thay vì id
            const skillIds = userInfo?.skills?.map((item: any) => item.id?.toString?.() ?? item.id) || [];
            console.log("skillIds:", skillIds);
            
            // Chỉ set các trường có giá trị, không set null/undefined
            const formValues: any = {};
            
            if (userInfo.name) formValues.name = userInfo.name;
            if (userInfo.email) formValues.email = userInfo.email;
            if (userInfo.age) formValues.age = userInfo.age.toString();
            if (userInfo.gender) formValues.gender = userInfo.gender;
            if (userInfo.address) formValues.address = userInfo.address;
            if (userInfo.phone) formValues.phone = userInfo.phone;
            if (userInfo.salary) formValues.salary = userInfo.salary.toString();
            if (userInfo.level) formValues.level = userInfo.level;
            if (skillIds.length > 0) formValues.skills = skillIds;
            
            console.log("Setting form values:", formValues);
            form.setFieldsValue(formValues);
        }
    }, [userInfo, form]);

    async function fetchSkillList(): Promise<ISkillSelect[]> {
        const res = await callFetchAllSkill(`page=1&size=100`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}` as string
                }
            })
            return temp;
        } else return [];
    }

    useEffect(() => {
        fetchSkillList().then((data) => {
            setOptionsSkills(data);
        });
    }, []);

    // Handle form submission
    const submitUserInfo = async (values: any) => {
        try {
            const { name, email, age, gender, address, phone, salary, level, skills } = values;
            const arrSkills = values?.skills?.map((item: string) => { return { id: +item } }) || [];
            const id = user.id;
            const userUpdate = {
                id,
                name,
                email,
                age: age ? parseInt(age) : 0,
                gender,
                address,
                phone,
                salary: salary ? parseInt(salary) : 0,
                level: level || null,
                skills: arrSkills
            };
            const res = await callUpdateUser(userUpdate);
            if (res && res.message) {
                message.success("Cập nhật thông tin thành công!");
                // Dispatch action để cập nhật Redux store
                await dispatch(fetchAccount());
                // Gọi callback onSuccess nếu có
                if (props.onSuccess) {
                    props.onSuccess();
                }
            }
            else {
                notification.error({
                    message: "Có lỗi xảy ra",
                    description: "Không nhận được phản hồi từ máy chủ. Vui lòng thử lại sau.",
                });
            }

        } catch (error) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: "Không thể kết nối tới máy chủ.",
            });
        }
    };

    return (
        <div style={{ padding: '0 16px' }}>
            <ProForm
                form={form}
                onFinish={submitUserInfo}
                initialValues={{}}
                submitter={{
                    searchConfig: {
                        submitText: "Cập nhật thông tin",
                    },
                    render: (props, doms) => {
                        return (
                            <div style={{ 
                                textAlign: 'left', 
                                marginTop: '24px',
                                paddingTop: '16px',
                                borderTop: '1px solid #f0f0f0'
                            }}>
                                <Button 
                                    type="primary" 
                                    size="large"
                                    onClick={() => props.form?.submit()}
                                    style={{ 
                                        minWidth: '120px',
                                        height: '40px',
                                        fontSize: '16px'
                                    }}
                                >
                                    Cập nhật thông tin
                                </Button>
                            </div>
                        );
                    }
                }}
                layout="vertical"
            >
                <Row gutter={[16, 8]}>
                    <Col span={12}>
                        <ProForm.Item 
                            name="name" 
                            label="Họ tên"
                            rules={[
                                { required: true, message: 'Vui lòng nhập họ tên!' },
                                { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                                { max: 50, message: 'Họ tên không được quá 50 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Nhập họ tên" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="email" 
                            label="Email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không đúng định dạng!' }
                            ]}
                        >
                            <Input disabled placeholder="Email không thể thay đổi" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="age" 
                            label="Tuổi"
                            required
                            rules={[
                                { required: true, message: 'Vui lòng nhập tuổi!' },
                                {
                                    validator: (_, value) => {
                                        // Chỉ validate nếu có giá trị (không rỗng)
                                        if (!value || value === '') {
                                            return Promise.resolve();
                                        }
    
                                        const strValue = String(value);
                                        if (strValue.includes('+') || strValue.includes('-')) {
                                            return Promise.reject(new Error('Tuổi không được chứa dấu + hoặc -!'));
                                        }

                                        const numValue = Number(value);
                                        if (isNaN(numValue)) {
                                            return Promise.reject(new Error('Tuổi phải là số!'));
                                        }
                                        if (!Number.isInteger(numValue)) {
                                            return Promise.reject(new Error('Tuổi phải là số nguyên!'));
                                        }
                                        if (numValue < 16) {
                                            return Promise.reject(new Error('Tuổi phải từ 16 trở lên!'));
                                        }
                                        if (numValue > 60) {
                                            return Promise.reject(new Error('Tuổi không được quá 60!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input placeholder="Nhập tuổi" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="gender" 
                            label="Giới tính"
                        >
                            <Select 
                                placeholder="Chọn giới tính"
                                allowClear
                                options={[{ label: 'Nam', value: 'MALE' }, { label: 'Nữ', value: 'FEMALE' }]} 
                            />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="address" 
                            label="Địa chỉ"
                        >
                            <Input placeholder="Nhập địa chỉ" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="phone" 
                            label="Số điện thoại"
                            rules={[
                                { required: false },
                                { 
                                    pattern: /^[0-9+\-\s()]*$/, 
                                    message: 'Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc!' 
                                },
                                { max: 20, message: 'Số điện thoại không được quá 20 ký tự!' }
                            ]}
                        >
                            <Input placeholder="Nhập số điện thoại" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="salary" 
                            label="Mức lương mong muốn"
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (value === undefined || value === null || value === '') {
                                            return Promise.resolve();
                                        }
                                        const strValue = String(value);
                                        if (strValue.includes('+') || strValue.includes('-')) {
                                            return Promise.reject(new Error('Mức lương không được chứa dấu + hoặc -!'));
                                        }
                                        if (!/^\d+$/.test(strValue)) {
                                            return Promise.reject(new Error('Mức lương chỉ được chứa số!'));
                                        }
                                        const numValue = Number(value);
                                        if (isNaN(numValue)) {
                                            return Promise.reject(new Error('Mức lương phải là số!'));
                                        }
                                        if (!Number.isInteger(numValue)) {
                                            return Promise.reject(new Error('Mức lương phải là số nguyên!'));
                                        }
                                        if (numValue < 0) {
                                            return Promise.reject(new Error('Mức lương không được âm!'));
                                        }
                                        if (numValue > 1000000000) {
                                            return Promise.reject(new Error('Mức lương không được quá 1 tỷ!'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input placeholder="Nhập mức lương (VND)" />
                        </ProForm.Item>
                    </Col>
                    <Col span={12}>
                        <ProForm.Item 
                            name="level" 
                            label="Cấp độ"
                        >
                            <Select 
                                placeholder="Chọn cấp độ"
                                allowClear
                                options={[
                                    { label: 'Intern', value: 'INTERN' },
                                    { label: 'Fresher', value: 'FRESHER' },
                                    { label: 'Junior', value: 'JUNIOR' },
                                    { label: 'Middle', value: 'MIDDLE' },
                                    { label: 'Senior', value: 'SENIOR' },
                                ]} 
                            />
                        </ProForm.Item>
                    </Col>
                    <Col span={24}>
                        <ProForm.Item 
                            name="skills" 
                            label="Kỹ năng"
                            rules={[
                                { type: 'array', max: 10, message: 'Không được chọn quá 10 kỹ năng!' }
                            ]}
                        >
                            <Select 
                                mode="multiple" 
                                options={optionsSkills}
                                placeholder="Chọn kỹ năng (tối đa 10)"
                                showSearch={false}
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </ProForm.Item>
                    </Col>
                </Row>
            </ProForm>
        </div>
    );
};

const ManageAccount = (props: IProps) => {
    const { open, onClose, onSuccess } = props;

    const onChange = (key: string) => {
        // console.log(key);
    };

    const items: TabsProps['items'] = [
        {
            key: 'user-resume',
            label: `Rải CV`,
            children: <UserResume />,
        },
        {
            key: 'user-update-info',
            label: `Cập nhật thông tin`,
            children: <UserUpdateInfo open={open} onSuccess={onSuccess} />,
        },
    ];

    return (
        <>
            <Modal
                title="Quản lý tài khoản"
                open={open}
                onCancel={() => onClose(false)}
                maskClosable={false}
                footer={null}
                destroyOnClose={true}
                width={isMobile ? "100%" : "1000px"}
            >
                <div style={{ minHeight: 400 }}>
                    <Tabs
                        defaultActiveKey="user-resume"
                        items={items}
                        onChange={onChange}
                    />
                </div>
            </Modal>
        </>
    )
}

export default ManageAccount;